import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import {
  SessionQueryDto,
  CreateWorkoutSessionDto,
  CreateWorkoutSessionResponseDto,
  WorkoutSessionListDto,
  WorkoutSessionDto,
  UpdateWorkoutSessionDto,
} from '../types';

/**
 * SessionsController - handles HTTP requests for workout sessions
 *
 * DEVELOPMENT MODE:
 * - Using DevAuthGuard which automatically injects a default user
 * - No JWT token required for testing
 * - Default user ID: 00000000-0000-0000-0000-000000000001
 *
 * TODO: Replace DevAuthGuard with JwtAuthGuard when authentication is implemented
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(DevAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * GET /sessions - List all workout sessions
   */
  @Get()
  @ApiOperation({ summary: 'List all workout sessions for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved sessions',
    type: WorkoutSessionListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Request() req,
    @Query() query: SessionQueryDto,
  ): Promise<WorkoutSessionListDto> {
    const userId = req.user.id;
    return this.sessionsService.list(userId, query);
  }

  /**
   * POST /sessions - Create a new workout session
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new workout session from a plan' })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully',
    type: CreateWorkoutSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workout plan not found' })
  async create(
    @Request() req,
    @Body() dto: CreateWorkoutSessionDto,
  ): Promise<CreateWorkoutSessionResponseDto> {
    const userId = req.user.id;
    return this.sessionsService.create(userId, dto);
  }

  /**
   * GET /sessions/:id - Get a single workout session
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single workout session with nested exercises and sets',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved session',
    type: WorkoutSessionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<WorkoutSessionDto> {
    const userId = req.user.id;
    return this.sessionsService.findOne(userId, id);
  }

  /**
   * PATCH /sessions/:id - Update session status
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update workout session status' })
  @ApiResponse({
    status: 200,
    description: 'Session updated successfully',
    type: WorkoutSessionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSessionDto> {
    const userId = req.user.id;
    return this.sessionsService.update(userId, id, dto);
  }

  /**
   * DELETE /sessions/:id - Cancel a session
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a workout session' })
  @ApiResponse({ status: 204, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    return this.sessionsService.remove(userId, id);
  }
}
