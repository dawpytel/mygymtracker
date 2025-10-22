import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { WorkoutPlansService } from './workout-plans.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import {
  WorkoutPlanListDto,
  WorkoutPlanQueryDto,
  CreateWorkoutPlanDto,
  WorkoutPlanDto,
  UpdateWorkoutPlanDto,
} from '../types';

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

  /**
   * POST /plans - Create a new workout plan with exercises
   * Creates a new workout plan for the authenticated user with nested exercises
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new workout plan',
    description:
      'Create a new workout plan with exercises for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Workout plan successfully created',
    type: WorkoutPlanDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - plan name already exists for user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(
    @Body() createWorkoutPlanDto: CreateWorkoutPlanDto,
    @Request() req,
  ): Promise<WorkoutPlanDto> {
    return this.workoutPlansService.createPlan(
      req.user.id,
      createWorkoutPlanDto,
    );
  }

  /**
   * GET /plans/:id - Get a specific workout plan
   * Returns a workout plan with all its exercises for the authenticated user
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific workout plan',
    description:
      'Retrieve a workout plan with all its exercises for the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Workout plan unique identifier',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved workout plan',
    type: WorkoutPlanDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - plan belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<WorkoutPlanDto> {
    return this.workoutPlansService.findPlanById(req.user.id, id);
  }

  /**
   * PUT /plans/:id - Update a workout plan
   * Updates a workout plan's name and/or exercises for the authenticated user
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a workout plan',
    description: "Update a workout plan's name and/or exercises for the authenticated user",
  })
  @ApiParam({
    name: 'id',
    description: 'Workout plan unique identifier',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Workout plan successfully updated',
    type: WorkoutPlanDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - plan belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - plan name already exists for user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async update(
    @Param('id') id: string,
    @Body() updateWorkoutPlanDto: UpdateWorkoutPlanDto,
    @Request() req,
  ): Promise<WorkoutPlanDto> {
    return this.workoutPlansService.updatePlan(
      req.user.id,
      id,
      updateWorkoutPlanDto,
    );
  }

  /**
   * DELETE /plans/:id - Delete a workout plan
   * Deletes a workout plan and all its associated exercises for the authenticated user
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a workout plan',
    description:
      'Delete a workout plan and all its associated exercises for the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Workout plan unique identifier',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Workout plan successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - plan belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async delete(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    await this.workoutPlansService.deletePlan(req.user.id, id);
  }
}
