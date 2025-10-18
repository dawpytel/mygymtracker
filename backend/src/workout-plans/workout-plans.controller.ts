import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkoutPlansService } from './workout-plans.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { WorkoutPlanListDto, WorkoutPlanQueryDto } from '../types';

/**
 * WorkoutPlansController - handles HTTP requests for workout plans
 *
 * DEVELOPMENT MODE:
 * - Using DevAuthGuard which automatically injects a default user
 * - No JWT token required for testing
 * - Default user ID: 00000000-0000-0000-0000-000000000001
 *
 * TODO: Replace DevAuthGuard with JwtAuthGuard when authentication is implemented
 */
@ApiTags('Workout Plans')
@Controller('plans')
@UseGuards(DevAuthGuard)
@ApiBearerAuth()
export class WorkoutPlansController {
  constructor(private readonly workoutPlansService: WorkoutPlansService) {}

  /**
   * GET /plans - List user's workout plans with pagination
   * Returns a paginated list of workout plans for the authenticated user
   */
  @Get()
  @ApiOperation({
    summary: "List user's workout plans",
    description:
      'Retrieve a paginated list of workout plans belonging to the authenticated user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of plans to return (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of plans to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved workout plans',
    type: WorkoutPlanListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(
    @Query() query: WorkoutPlanQueryDto,
    @Request() req,
  ): Promise<WorkoutPlanListDto> {
    return this.workoutPlansService.findUserPlans(req.user.id, query);
  }
}
