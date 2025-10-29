import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SessionQueryDto,
  CreateWorkoutSessionDto,
  CreateWorkoutSessionResponseDto,
  WorkoutSessionListDto,
  WorkoutSessionDto,
  WorkoutSessionDetailDto,
  UpdateWorkoutSessionDto,
  UpdateSessionExerciseDto,
  CreateExerciseSetDto,
  UpdateExerciseSetDto,
  ExerciseSetDto,
  SessionExerciseDto,
} from '../types';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

/**
 * SessionsController - handles HTTP requests for workout sessions
 *
 * AUTHENTICATION:
 * - Protected by JwtAuthGuard - requires valid JWT token
 * - JWT token must be provided in Authorization header as "Bearer <token>"
 * - User context is automatically extracted from the token
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
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
    @Req() req: AuthenticatedRequest,
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
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkoutSessionDto,
  ): Promise<CreateWorkoutSessionResponseDto> {
    const userId = req.user.id;
    return this.sessionsService.create(userId, dto);
  }

  /**
   * GET /sessions/:id - Get a single workout session with full details
   */
  @Get(':id')
  @ApiOperation({
    summary:
      'Get a single workout session with full exercise details and history',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved session with full details',
    type: WorkoutSessionDetailDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<WorkoutSessionDetailDto> {
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
    @Req() req: AuthenticatedRequest,
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
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.user.id;
    return this.sessionsService.remove(userId, id);
  }

  /**
   * PATCH /sessions/:sessionId/exercises/:exerciseId - Update exercise notes
   */
  @Patch(':sessionId/exercises/:exerciseId')
  @ApiOperation({ summary: 'Update session exercise notes' })
  @ApiResponse({
    status: 200,
    description: 'Exercise updated successfully',
    type: SessionExerciseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session or exercise not found' })
  async updateExercise(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() dto: UpdateSessionExerciseDto,
  ): Promise<SessionExerciseDto> {
    const userId = req.user.id;
    return this.sessionsService.updateExercise(
      userId,
      sessionId,
      exerciseId,
      dto,
    );
  }

  /**
   * POST /sessions/:sessionId/exercises/:exerciseId/sets - Create a new set
   */
  @Post(':sessionId/exercises/:exerciseId/sets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a set to a session exercise' })
  @ApiResponse({
    status: 201,
    description: 'Set created successfully',
    type: ExerciseSetDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({ status: 404, description: 'Session or exercise not found' })
  async createSet(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() dto: CreateExerciseSetDto,
  ): Promise<ExerciseSetDto> {
    const userId = req.user.id;
    return this.sessionsService.createSet(userId, sessionId, exerciseId, dto);
  }

  /**
   * PATCH /sessions/:sessionId/exercises/:exerciseId/sets/:setId - Update a set
   */
  @Patch(':sessionId/exercises/:exerciseId/sets/:setId')
  @ApiOperation({ summary: 'Update an exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Set updated successfully',
    type: ExerciseSetDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your session' })
  @ApiResponse({
    status: 404,
    description: 'Session, exercise, or set not found',
  })
  async updateSet(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
    @Param('setId') setId: string,
    @Body() dto: UpdateExerciseSetDto,
  ): Promise<ExerciseSetDto> {
    const userId = req.user.id;
    return this.sessionsService.updateSet(
      userId,
      sessionId,
      exerciseId,
      setId,
      dto,
    );
  }
}
