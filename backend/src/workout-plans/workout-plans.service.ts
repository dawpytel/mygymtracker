import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { WorkoutPlanListDto, WorkoutPlanQueryDto } from '../types';

/**
 * WorkoutPlansService - handles business logic for workout plans
 */
@Injectable()
export class WorkoutPlansService {
  private readonly logger = new Logger(WorkoutPlansService.name);

  constructor(
    @InjectRepository(WorkoutPlan)
    private readonly workoutPlanRepository: Repository<WorkoutPlan>,
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
}
