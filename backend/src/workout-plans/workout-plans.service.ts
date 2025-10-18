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

      const savedPlan = await queryRunner.manager.save(WorkoutPlan, workoutPlan);

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

      // Map to DTO
      return {
        id: savedPlan.id,
        plan_name: savedPlan.plan_name,
        exercises: savedExercises.map((ex) => this.mapPlanExerciseToDto(ex)),
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
   * Helper method to map PlanExercise entity to DTO
   */
  private mapPlanExerciseToDto(entity: PlanExercise): PlanExerciseDto {
    return {
      id: entity.id,
      plan_id: entity.plan_id,
      exercise_id: entity.exercise_id,
      display_order: entity.display_order,
      intensity_technique: entity.intensity_technique,
      warmup_sets: entity.warmup_sets,
      working_sets: entity.working_sets,
      target_reps: entity.target_reps,
      rpe_early: entity.rpe_early,
      rpe_last: entity.rpe_last,
      rest_time: entity.rest_time,
      notes: entity.notes,
    };
  }
}
