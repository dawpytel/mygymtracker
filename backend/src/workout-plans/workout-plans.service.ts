import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { PlanExercise } from './entities/plan-exercise.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import {
  WorkoutPlanListDto,
  WorkoutPlanQueryDto,
  CreateWorkoutPlanDto,
  WorkoutPlanDto,
  UpdateWorkoutPlanDto,
  UpdatePlanExerciseDto,
  PlanExerciseDto,
} from '../types';

/**
 * WorkoutPlansService - handles business logic for workout plans
 */
@Injectable()
export class WorkoutPlansService {
  private readonly logger = new Logger(WorkoutPlansService.name);

  constructor(
    @InjectRepository(WorkoutPlan)
    private readonly workoutPlanRepository: Repository<WorkoutPlan>,
    @InjectRepository(PlanExercise)
    private readonly planExerciseRepository: Repository<PlanExercise>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Find all workout plans for a specific user with pagination
   * @param userId - User's UUID from JWT token
   * @param query - Pagination parameters (limit, offset)
   * @returns Paginated list of workout plans
   * @throws InternalServerErrorException if database query fails
   */
  async findUserPlans(
    userId: string,
    query: WorkoutPlanQueryDto,
  ): Promise<WorkoutPlanListDto> {
    // Guard clause: validate userId
    if (!userId) {
      this.logger.error('findUserPlans called with undefined userId');
      throw new InternalServerErrorException('User ID is required');
    }

    try {
      const { limit = 20, offset = 0 } = query;

      // Execute query with pagination and filtering
      const [plans, total] = await this.workoutPlanRepository.findAndCount({
        where: { user_id: userId },
        select: ['id', 'plan_name', 'created_at'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });

      this.logger.log(
        `Found ${plans.length} workout plans for user ${userId} (total: ${total})`,
      );

      return {
        items: plans,
        total,
      };
    } catch (error) {
      // Log error with context for debugging
      this.logger.error(
        `Failed to fetch workout plans for user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch workout plans');
    }
  }

  /**
   * Create a new workout plan with exercises
   * @param userId - User's UUID from JWT token
   * @param dto - Workout plan creation data with nested exercises
   * @returns Created workout plan with exercises
   * @throws ConflictException if plan_name already exists for user
   * @throws InternalServerErrorException if database operation fails
   */
  async createPlan(
    userId: string,
    dto: CreateWorkoutPlanDto,
  ): Promise<WorkoutPlanDto> {
    // Guard clause: validate userId
    if (!userId) {
      this.logger.error('createPlan called with undefined userId');
      throw new InternalServerErrorException('User ID is required');
    }

    // Guard clause: validate dto
    if (!dto.plan_name || !dto.exercises) {
      this.logger.error('createPlan called with invalid DTO');
      throw new InternalServerErrorException('Invalid plan data');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for duplicate plan name
      const existingPlan = await queryRunner.manager.findOne(WorkoutPlan, {
        where: { user_id: userId, plan_name: dto.plan_name },
      });

      if (existingPlan) {
        this.logger.warn(
          `Duplicate plan name "${dto.plan_name}" for user ${userId}`,
        );
        throw new ConflictException(
          `A plan with name "${dto.plan_name}" already exists`,
        );
      }

      // Create workout plan
      const workoutPlan = queryRunner.manager.create(WorkoutPlan, {
        user_id: userId,
        plan_name: dto.plan_name,
      });

      const savedPlan = await queryRunner.manager.save(
        WorkoutPlan,
        workoutPlan,
      );

      // Create plan exercises
      const planExercises = dto.exercises.map((exerciseDto) =>
        queryRunner.manager.create(PlanExercise, {
          plan_id: savedPlan.id,
          exercise_id: exerciseDto.exercise_id,
          display_order: exerciseDto.display_order,
          intensity_technique: exerciseDto.intensity_technique,
          warmup_sets: exerciseDto.warmup_sets,
          working_sets: exerciseDto.working_sets,
          target_reps: exerciseDto.target_reps,
          rpe_early: exerciseDto.rpe_early,
          rpe_last: exerciseDto.rpe_last,
          rest_time: exerciseDto.rest_time,
          notes: exerciseDto.notes,
        }),
      );

      const savedExercises = await queryRunner.manager.save(
        PlanExercise,
        planExercises,
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Created workout plan ${savedPlan.id} with ${savedExercises.length} exercises for user ${userId}`,
      );

      // Fetch exercises with names for the response
      const rawExercises = await this.planExerciseRepository
        .createQueryBuilder('pe')
        .leftJoin('exercises', 'e', 'e.id = pe.exercise_id')
        .select('pe.id', 'id')
        .addSelect('pe.plan_id', 'plan_id')
        .addSelect('pe.exercise_id', 'exercise_id')
        .addSelect('e.name', 'exercise_name')
        .addSelect('pe.display_order', 'display_order')
        .addSelect('pe.intensity_technique', 'intensity_technique')
        .addSelect('pe.warmup_sets', 'warmup_sets')
        .addSelect('pe.working_sets', 'working_sets')
        .addSelect('pe.target_reps', 'target_reps')
        .addSelect('pe.rpe_early', 'rpe_early')
        .addSelect('pe.rpe_last', 'rpe_last')
        .addSelect('pe.rest_time', 'rest_time')
        .addSelect('pe.notes', 'notes')
        .where('pe.plan_id = :planId', { planId: savedPlan.id })
        .orderBy('pe.display_order', 'ASC')
        .getRawMany();

      // Map to DTO
      return {
        id: savedPlan.id,
        plan_name: savedPlan.plan_name,
        exercises: rawExercises,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to create workout plan for user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create workout plan');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find a specific workout plan by ID for a user
   * @param userId - User's UUID from JWT token
   * @param planId - Workout plan's UUID
   * @returns Workout plan with exercises
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if plan belongs to another user
   * @throws InternalServerErrorException if database query fails
   */
  async findPlanById(userId: string, planId: string): Promise<WorkoutPlanDto> {
    // Guard clause: validate userId
    if (!userId) {
      this.logger.error('findPlanById called with undefined userId');
      throw new InternalServerErrorException('User ID is required');
    }

    // Guard clause: validate planId
    if (!planId) {
      this.logger.error('findPlanById called with undefined planId');
      throw new InternalServerErrorException('Plan ID is required');
    }

    try {
      // Fetch the workout plan
      const plan = await this.workoutPlanRepository.findOne({
        where: { id: planId },
        select: ['id', 'user_id', 'plan_name'],
      });

      // Guard clause: plan not found
      if (!plan) {
        this.logger.warn(`Workout plan ${planId} not found`);
        throw new NotFoundException('Workout plan not found');
      }

      // Guard clause: check ownership
      if (plan.user_id !== userId) {
        this.logger.warn(
          `User ${userId} attempted to access plan ${planId} owned by ${plan.user_id}`,
        );
        throw new ForbiddenException(
          'You do not have permission to access this workout plan',
        );
      }

      // Fetch plan exercises with exercise names
      const rawExercises = await this.planExerciseRepository
        .createQueryBuilder('pe')
        .leftJoin('exercises', 'e', 'e.id = pe.exercise_id')
        .select('pe.id', 'id')
        .addSelect('pe.plan_id', 'plan_id')
        .addSelect('pe.exercise_id', 'exercise_id')
        .addSelect('e.name', 'exercise_name')
        .addSelect('pe.display_order', 'display_order')
        .addSelect('pe.intensity_technique', 'intensity_technique')
        .addSelect('pe.warmup_sets', 'warmup_sets')
        .addSelect('pe.working_sets', 'working_sets')
        .addSelect('pe.target_reps', 'target_reps')
        .addSelect('pe.rpe_early', 'rpe_early')
        .addSelect('pe.rpe_last', 'rpe_last')
        .addSelect('pe.rest_time', 'rest_time')
        .addSelect('pe.notes', 'notes')
        .where('pe.plan_id = :planId', { planId })
        .orderBy('pe.display_order', 'ASC')
        .getRawMany();

      this.logger.log(
        `Retrieved workout plan ${planId} with ${rawExercises.length} exercises for user ${userId}`,
      );

      return {
        id: plan.id,
        plan_name: plan.plan_name,
        exercises: rawExercises,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to fetch workout plan ${planId} for user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch workout plan');
    }
  }

  /**
   * Update a workout plan's name and/or exercises
   * @param userId - User's UUID from JWT token
   * @param planId - Workout plan's UUID
   * @param dto - Update data with new plan name and optionally exercises
   * @returns Updated workout plan with exercises
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if plan belongs to another user
   * @throws ConflictException if new name already exists for user
   * @throws InternalServerErrorException if database operation fails
   */
  async updatePlan(
    userId: string,
    planId: string,
    dto: UpdateWorkoutPlanDto,
  ): Promise<WorkoutPlanDto> {
    // Guard clause: validate userId
    if (!userId) {
      this.logger.error('updatePlan called with undefined userId');
      throw new InternalServerErrorException('User ID is required');
    }

    // Guard clause: validate planId
    if (!planId) {
      this.logger.error('updatePlan called with undefined planId');
      throw new InternalServerErrorException('Plan ID is required');
    }

    // Guard clause: validate dto
    if (!dto.plan_name) {
      this.logger.error('updatePlan called with invalid DTO');
      throw new InternalServerErrorException('Plan name is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch the workout plan
      const plan = await queryRunner.manager.findOne(WorkoutPlan, {
        where: { id: planId },
        select: ['id', 'user_id', 'plan_name'],
      });

      // Guard clause: plan not found
      if (!plan) {
        this.logger.warn(`Workout plan ${planId} not found`);
        throw new NotFoundException('Workout plan not found');
      }

      // Guard clause: check ownership
      if (plan.user_id !== userId) {
        this.logger.warn(
          `User ${userId} attempted to update plan ${planId} owned by ${plan.user_id}`,
        );
        throw new ForbiddenException(
          'You do not have permission to update this workout plan',
        );
      }

      // Check for duplicate plan name (only if name is changing)
      if (plan.plan_name !== dto.plan_name) {
        const existingPlan = await queryRunner.manager.findOne(WorkoutPlan, {
          where: { user_id: userId, plan_name: dto.plan_name },
        });

        if (existingPlan) {
          this.logger.warn(
            `Duplicate plan name "${dto.plan_name}" for user ${userId}`,
          );
          throw new ConflictException(
            `A plan with name "${dto.plan_name}" already exists`,
          );
        }

        // Update plan name
        plan.plan_name = dto.plan_name;
        await queryRunner.manager.save(WorkoutPlan, plan);
      }

      // Update exercises if provided
      if (dto.exercises && dto.exercises.length > 0) {
        // Delete all existing plan exercises
        await queryRunner.manager.delete(PlanExercise, { plan_id: planId });

        // Create new plan exercises
        const planExercises = dto.exercises.map((exerciseDto) =>
          queryRunner.manager.create(PlanExercise, {
            plan_id: planId,
            exercise_id: exerciseDto.exercise_id,
            display_order: exerciseDto.display_order,
            intensity_technique: exerciseDto.intensity_technique,
            warmup_sets: exerciseDto.warmup_sets,
            working_sets: exerciseDto.working_sets,
            target_reps: exerciseDto.target_reps,
            rpe_early: exerciseDto.rpe_early,
            rpe_last: exerciseDto.rpe_last,
            rest_time: exerciseDto.rest_time,
            notes: exerciseDto.notes,
          }),
        );

        await queryRunner.manager.save(PlanExercise, planExercises);

        this.logger.log(
          `Updated ${planExercises.length} exercises for plan ${planId}`,
        );
      }

      await queryRunner.commitTransaction();

      // Fetch plan exercises with exercise names
      const rawExercises = await this.planExerciseRepository
        .createQueryBuilder('pe')
        .leftJoin('exercises', 'e', 'e.id = pe.exercise_id')
        .select('pe.id', 'id')
        .addSelect('pe.plan_id', 'plan_id')
        .addSelect('pe.exercise_id', 'exercise_id')
        .addSelect('e.name', 'exercise_name')
        .addSelect('pe.display_order', 'display_order')
        .addSelect('pe.intensity_technique', 'intensity_technique')
        .addSelect('pe.warmup_sets', 'warmup_sets')
        .addSelect('pe.working_sets', 'working_sets')
        .addSelect('pe.target_reps', 'target_reps')
        .addSelect('pe.rpe_early', 'rpe_early')
        .addSelect('pe.rpe_last', 'rpe_last')
        .addSelect('pe.rest_time', 'rest_time')
        .addSelect('pe.notes', 'notes')
        .where('pe.plan_id = :planId', { planId })
        .orderBy('pe.display_order', 'ASC')
        .getRawMany();

      this.logger.log(
        `Updated workout plan ${planId} for user ${userId} with new name "${dto.plan_name}"`,
      );

      return {
        id: plan.id,
        plan_name: plan.plan_name,
        exercises: rawExercises,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to update workout plan ${planId} for user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update workout plan');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a workout plan and all its associated exercises
   * @param userId - User's UUID from JWT token
   * @param planId - Workout plan UUID to delete
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if plan belongs to another user
   * @throws InternalServerErrorException if database operation fails
   */
  async deletePlan(userId: string, planId: string): Promise<void> {
    // Guard clauses: validate inputs
    if (!userId) {
      this.logger.error('deletePlan called with undefined userId');
      throw new InternalServerErrorException('User ID is required');
    }

    if (!planId) {
      this.logger.error('deletePlan called with undefined planId');
      throw new InternalServerErrorException('Plan ID is required');
    }

    try {
      // Check if plan exists and belongs to user
      const plan = await this.workoutPlanRepository.findOne({
        where: { id: planId },
        select: ['id', 'user_id'],
      });

      // Handle plan not found
      if (!plan) {
        this.logger.warn(`Workout plan ${planId} not found`);
        throw new NotFoundException(`Workout plan with ID ${planId} not found`);
      }

      // Check ownership
      if (plan.user_id !== userId) {
        this.logger.warn(
          `User ${userId} attempted to delete plan ${planId} owned by ${plan.user_id}`,
        );
        throw new ForbiddenException(
          'You do not have permission to delete this workout plan',
        );
      }

      // Delete plan exercises first (RLS prevents cascade delete from working)
      await this.planExerciseRepository.delete({ plan_id: planId });

      // Then delete the plan
      await this.workoutPlanRepository.delete({ id: planId });

      this.logger.log(
        `Successfully deleted workout plan ${planId} for user ${userId}`,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to delete workout plan ${planId} for user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete workout plan');
    }
  }
}
