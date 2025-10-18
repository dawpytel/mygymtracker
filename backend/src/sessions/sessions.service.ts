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
import {
  SessionQueryDto,
  CreateWorkoutSessionDto,
  CreateWorkoutSessionResponseDto,
  WorkoutSessionListDto,
  WorkoutSessionListItemDto,
  WorkoutSessionDto,
  UpdateWorkoutSessionDto,
  SessionStatus,
  SessionExerciseDto,
  ExerciseSetDto,
} from '../types';

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

      // Create new session
      const session = this.sessionRepository.create({
        user_id: userId,
        plan_id: dto.plan_id,
        status: SessionStatus.IN_PROGRESS,
        started_at: new Date(),
      });

      const savedSession = await this.sessionRepository.save(session);

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
   * Get a single workout session with nested exercises and sets
   */
  async findOne(userId: string, sessionId: string): Promise<WorkoutSessionDto> {
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
          'You do not have permission to access this session',
        );
      }

      // Map to DTO
      const exercises: SessionExerciseDto[] = (
        session.session_exercises || []
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
}
