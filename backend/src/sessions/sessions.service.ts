import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise } from './entities/session-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutPlan } from '../workout-plans/entities/workout-plan.entity';
import { PlanExercise } from '../workout-plans/entities/plan-exercise.entity';
import {
  SessionQueryDto,
  CreateWorkoutSessionDto,
  CreateWorkoutSessionResponseDto,
  WorkoutSessionListDto,
  WorkoutSessionListItemDto,
  WorkoutSessionDto,
  WorkoutSessionDetailDto,
  SessionExerciseDetailDto,
  ExerciseHistoryEntry,
  UpdateWorkoutSessionDto,
  SessionStatus,
  SessionExerciseDto,
  ExerciseSetDto,
  IntensityTechnique,
  SetType,
  UpdateSessionExerciseDto,
  CreateExerciseSetDto,
  UpdateExerciseSetDto,
  WarmupSetSuggestion,
} from '../types';
import { WarmupService } from '../common/warmup/warmup.service';

/**
 * SessionsService - handles business logic for workout sessions
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(WorkoutSession)
    private readonly sessionRepository: Repository<WorkoutSession>,
    @InjectRepository(SessionExercise)
    private readonly sessionExerciseRepository: Repository<SessionExercise>,
    @InjectRepository(ExerciseSet)
    private readonly exerciseSetRepository: Repository<ExerciseSet>,
    @InjectRepository(WorkoutPlan)
    private readonly planRepository: Repository<WorkoutPlan>,
    @InjectRepository(PlanExercise)
    private readonly planExerciseRepository: Repository<PlanExercise>,
    private readonly warmupService: WarmupService,
  ) {}

  /**
   * List all workout sessions for a user with optional filtering and pagination
   */
  async list(
    userId: string,
    query: SessionQueryDto,
  ): Promise<WorkoutSessionListDto> {
    try {
      const { limit = 20, offset = 0, status } = query;

      const queryBuilder = this.sessionRepository
        .createQueryBuilder('session')
        .where('session.user_id = :userId', { userId })
        .orderBy('session.started_at', 'DESC')
        .skip(offset)
        .take(limit);

      // Apply status filter if not 'all'
      if (status && status !== 'all') {
        queryBuilder.andWhere('session.status = :status', { status });
      }

      const [sessions, total] = await queryBuilder.getManyAndCount();

      const items: WorkoutSessionListItemDto[] = sessions.map((session) => ({
        id: session.id,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
      }));

      return { items, total };
    } catch (error) {
      this.logger.error(
        `Failed to list sessions for user ${userId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve sessions');
    }
  }

  /**
   * Create a new workout session from a workout plan
   */
  async create(
    userId: string,
    dto: CreateWorkoutSessionDto,
  ): Promise<CreateWorkoutSessionResponseDto> {
    try {
      // Verify plan exists and belongs to user
      const plan = await this.planRepository.findOne({
        where: { id: dto.plan_id, user_id: userId },
      });

      if (!plan) {
        throw new NotFoundException(
          `Workout plan with ID ${dto.plan_id} not found`,
        );
      }

      // Get all exercises from the plan
      const planExercises = await this.planExerciseRepository.find({
        where: { plan_id: dto.plan_id },
        order: { display_order: 'ASC' },
      });

      // Create new session
      const session = this.sessionRepository.create({
        user_id: userId,
        plan_id: dto.plan_id,
        status: SessionStatus.IN_PROGRESS,
        started_at: new Date(),
      });

      const savedSession = await this.sessionRepository.save(session);

      // Create session exercises from plan exercises
      const sessionExercises = planExercises.map((planExercise) => {
        return this.sessionExerciseRepository.create({
          session_id: savedSession.id,
          plan_exercise_id: planExercise.id,
          exercise_id: planExercise.exercise_id,
          display_order: planExercise.display_order,
          notes: planExercise.notes || '',
        });
      });

      // Save all session exercises
      if (sessionExercises.length > 0) {
        await this.sessionExerciseRepository.save(sessionExercises);
      }

      return {
        id: savedSession.id,
        status: savedSession.status,
        started_at: savedSession.started_at,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to create session for user ${userId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create session');
    }
  }

  /**
   * Get a single workout session with full exercise details and history
   */
  async findOne(
    userId: string,
    sessionId: string,
  ): Promise<WorkoutSessionDetailDto> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: [
          'session_exercises',
          'session_exercises.exercise_sets',
          'session_exercises.exercise',
        ],
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      // Verify ownership
      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to access this session',
        );
      }

      // Map to DTO with extended data
      const exercises: SessionExerciseDetailDto[] = await Promise.all(
        (session.session_exercises || []).map(async (sessionExercise) => {
          // Fetch plan exercise data if available
          let planExercise: PlanExercise | null = null;
          if (sessionExercise.plan_exercise_id) {
            planExercise = await this.planExerciseRepository.findOne({
              where: { id: sessionExercise.plan_exercise_id },
            });
          }

          // Fetch recent history for this exercise (last 5 completed sessions)
          const history = await this.getExerciseHistory(
            userId,
            sessionExercise.exercise_id,
            5,
          );

          // Calculate warmup suggestions based on history
          const warmupSuggestions = this.calculateWarmupSuggestions(
            history,
            planExercise?.warmup_sets || 0,
          );

          return {
            id: sessionExercise.id,
            exercise_id: sessionExercise.exercise_id,
            exercise_name: sessionExercise.exercise?.name || 'Unknown Exercise',
            display_order: sessionExercise.display_order,
            warmup_sets: planExercise?.warmup_sets || 0,
            working_sets: planExercise?.working_sets || 3,
            target_reps: planExercise?.target_reps || 10,
            rpe_early: planExercise?.rpe_early || 7,
            rpe_last: planExercise?.rpe_last || 9,
            rest_time: planExercise?.rest_time || 120,
            intensity_technique:
              planExercise?.intensity_technique || IntensityTechnique.NA,
            notes: sessionExercise.notes || '',
            history: history || [],
            warmup_suggestions: warmupSuggestions,
            sets: (sessionExercise.exercise_sets || []).map((set) => ({
              id: set.id,
              set_type: set.set_type,
              set_index: set.set_index,
              reps: set.reps,
              load: set.load,
              created_at: set.created_at,
            })),
          };
        }),
      );

      return {
        id: session.id,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
        exercises,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to retrieve session ${sessionId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve session');
    }
  }

  /**
   * Get recent history for an exercise
   * Returns the last N completed sessions for a specific exercise
   */
  private async getExerciseHistory(
    userId: string,
    exerciseId: string,
    limit: number = 5,
  ): Promise<ExerciseHistoryEntry[]> {
    try {
      // Query completed sessions with this exercise
      const completedSessions = await this.sessionRepository
        .createQueryBuilder('session')
        .innerJoin('session.session_exercises', 'se')
        .innerJoin('se.exercise_sets', 'es')
        .where('session.user_id = :userId', { userId })
        .andWhere('session.status = :status', {
          status: SessionStatus.COMPLETED,
        })
        .andWhere('se.exercise_id = :exerciseId', { exerciseId })
        .orderBy('session.completed_at', 'DESC')
        .limit(limit)
        .select(['session.completed_at', 'es.reps', 'es.load', 'es.set_type'])
        .getRawMany();

      // Group by session and get the best working set from each
      const historyMap = new Map<string, ExerciseHistoryEntry>();

      completedSessions.forEach((row) => {
        const date = row.session_completed_at;
        // Only consider working sets for history
        if (row.es_set_type === 'working') {
          const existing = historyMap.get(date);
          if (
            !existing ||
            row.es_load > existing.load ||
            (row.es_load === existing.load && row.es_reps > existing.reps)
          ) {
            historyMap.set(date, {
              date: new Date(date).toISOString(),
              reps: row.es_reps,
              load: row.es_load,
            });
          }
        }
      });

      return Array.from(historyMap.values()).slice(0, limit);
    } catch (error) {
      this.logger.error(
        `Failed to fetch exercise history for exercise ${exerciseId}:`,
        error.stack,
      );
      // Return empty history on error rather than failing the whole request
      return [];
    }
  }

  /**
   * Update a workout session status
   */
  async update(
    userId: string,
    sessionId: string,
    dto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSessionDto> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['session_exercises', 'session_exercises.exercise_sets'],
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      // Verify ownership
      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this session',
        );
      }

      // Verify session is in progress
      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only in-progress sessions can be updated',
        );
      }

      // Update status
      session.status = dto.status;

      // Set completed_at if status is completed
      if (dto.status === SessionStatus.COMPLETED) {
        session.completed_at = new Date();
      } else if (dto.status === SessionStatus.CANCELLED) {
        session.completed_at = new Date();
      }

      const updatedSession = await this.sessionRepository.save(session);

      // Map to DTO
      const exercises: SessionExerciseDto[] = (
        updatedSession.session_exercises || []
      ).map((exercise) => ({
        id: exercise.id,
        exercise_id: exercise.exercise_id,
        display_order: exercise.display_order,
        notes: exercise.notes,
        sets: (exercise.exercise_sets || []).map((set) => ({
          id: set.id,
          set_type: set.set_type,
          set_index: set.set_index,
          reps: set.reps,
          load: set.load,
          created_at: set.created_at,
        })),
      }));

      return {
        id: updatedSession.id,
        status: updatedSession.status,
        started_at: updatedSession.started_at,
        completed_at: updatedSession.completed_at,
        exercises,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to update session ${sessionId}:`, error.stack);
      throw new InternalServerErrorException('Failed to update session');
    }
  }

  /**
   * Cancel a workout session (soft delete)
   */
  async remove(userId: string, sessionId: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      // Verify ownership
      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this session',
        );
      }

      // Verify session is in progress
      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only in-progress sessions can be cancelled',
        );
      }

      // Update status to cancelled
      session.status = SessionStatus.CANCELLED;
      session.completed_at = new Date();

      await this.sessionRepository.save(session);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to cancel session ${sessionId}:`, error.stack);
      throw new InternalServerErrorException('Failed to cancel session');
    }
  }

  /**
   * Update exercise notes within a session
   */
  async updateExercise(
    userId: string,
    sessionId: string,
    exerciseId: string,
    dto: UpdateSessionExerciseDto,
  ): Promise<SessionExerciseDto> {
    try {
      // Verify session exists and belongs to user
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this session',
        );
      }

      // Verify session is in progress
      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only in-progress sessions can be updated',
        );
      }

      // Find and update the exercise
      const exercise = await this.sessionExerciseRepository.findOne({
        where: { id: exerciseId, session_id: sessionId },
        relations: ['exercise_sets'],
      });

      if (!exercise) {
        throw new NotFoundException(
          `Exercise with ID ${exerciseId} not found in session ${sessionId}`,
        );
      }

      // Update fields
      if (dto.notes !== undefined) {
        exercise.notes = dto.notes;
      }
      if (dto.display_order !== undefined) {
        exercise.display_order = dto.display_order;
      }

      const updatedExercise =
        await this.sessionExerciseRepository.save(exercise);

      return {
        id: updatedExercise.id,
        exercise_id: updatedExercise.exercise_id,
        display_order: updatedExercise.display_order,
        notes: updatedExercise.notes,
        sets: (updatedExercise.exercise_sets || []).map((set) => ({
          id: set.id,
          set_type: set.set_type,
          set_index: set.set_index,
          reps: set.reps,
          load: set.load,
          created_at: set.created_at,
        })),
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update exercise ${exerciseId} in session ${sessionId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update exercise');
    }
  }

  /**
   * Create a new set for an exercise
   */
  async createSet(
    userId: string,
    sessionId: string,
    exerciseId: string,
    dto: CreateExerciseSetDto,
  ): Promise<ExerciseSetDto> {
    try {
      // Verify session exists and belongs to user
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this session',
        );
      }

      // Verify session is in progress
      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only in-progress sessions can be updated',
        );
      }

      // Verify exercise exists in session
      const exercise = await this.sessionExerciseRepository.findOne({
        where: { id: exerciseId, session_id: sessionId },
      });

      if (!exercise) {
        throw new NotFoundException(
          `Exercise with ID ${exerciseId} not found in session ${sessionId}`,
        );
      }

      // Create new set
      const set = this.exerciseSetRepository.create({
        session_exercise_id: exerciseId,
        set_type: dto.set_type,
        set_index: dto.set_index,
        reps: dto.reps,
        load: dto.load,
      });

      const savedSet = await this.exerciseSetRepository.save(set);

      return {
        id: savedSet.id,
        set_type: savedSet.set_type,
        set_index: savedSet.set_index,
        reps: savedSet.reps,
        load: savedSet.load,
        created_at: savedSet.created_at,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to create set for exercise ${exerciseId} in session ${sessionId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create set');
    }
  }

  /**
   * Update an existing set
   */
  async updateSet(
    userId: string,
    sessionId: string,
    exerciseId: string,
    setId: string,
    dto: UpdateExerciseSetDto,
  ): Promise<ExerciseSetDto> {
    try {
      // Verify session exists and belongs to user
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Workout session with ID ${sessionId} not found`,
        );
      }

      if (session.user_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this session',
        );
      }

      // Verify session is in progress
      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Only in-progress sessions can be updated',
        );
      }

      // Verify exercise exists in session
      const exercise = await this.sessionExerciseRepository.findOne({
        where: { id: exerciseId, session_id: sessionId },
      });

      if (!exercise) {
        throw new NotFoundException(
          `Exercise with ID ${exerciseId} not found in session ${sessionId}`,
        );
      }

      // Find and update the set
      const set = await this.exerciseSetRepository.findOne({
        where: { id: setId, session_exercise_id: exerciseId },
      });

      if (!set) {
        throw new NotFoundException(
          `Set with ID ${setId} not found in exercise ${exerciseId}`,
        );
      }

      // Update fields
      if (dto.set_type !== undefined) {
        set.set_type = dto.set_type;
      }
      if (dto.set_index !== undefined) {
        set.set_index = dto.set_index;
      }
      if (dto.reps !== undefined) {
        set.reps = dto.reps;
      }
      if (dto.load !== undefined) {
        set.load = dto.load;
      }

      const updatedSet = await this.exerciseSetRepository.save(set);

      return {
        id: updatedSet.id,
        set_type: updatedSet.set_type,
        set_index: updatedSet.set_index,
        reps: updatedSet.reps,
        load: updatedSet.load,
        created_at: updatedSet.created_at,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update set ${setId} in exercise ${exerciseId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update set');
    }
  }

  /**
   * Calculate warmup set suggestions based on exercise history
   * Uses the WarmupService to generate intelligent recommendations
   *
   * @param history - Recent exercise history entries
   * @param numberOfWarmupSets - Number of warmup sets configured in plan
   * @returns Array of warmup set suggestions
   */
  private calculateWarmupSuggestions(
    history: ExerciseHistoryEntry[],
    numberOfWarmupSets: number,
  ): WarmupSetSuggestion[] {
    // Guard clause: no warmup sets requested
    if (numberOfWarmupSets <= 0) {
      return [];
    }

    try {
      // Extract working loads from history
      const recentWorkingLoads = history.map((entry) => entry.load);

      // Use warmup service to calculate suggestions
      const suggestions = this.warmupService.calculateFromHistory(
        recentWorkingLoads,
        numberOfWarmupSets,
      );

      this.logger.debug(
        `Generated ${suggestions.length} warmup suggestions based on ${recentWorkingLoads.length} historical entries`,
      );

      return suggestions;
    } catch (error) {
      // Fallback: return empty array on error rather than failing the whole request
      this.logger.error(
        'Failed to calculate warmup suggestions:',
        error.stack,
      );
      return [];
    }
  }
}
