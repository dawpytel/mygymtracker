import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExercisesService } from './exercises.service';
import { ExerciseQueryDto, ExerciseListDto, ExerciseDto } from '../types';

/**
 * Controller for exercise endpoints
 * Provides read-only access to exercise catalog
 */
@ApiTags('exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * List exercises with optional search and pagination
   * Supports autocomplete functionality via search parameter
   */
  @Get()
  @ApiOperation({ summary: 'List exercises with autocomplete' })
  @ApiResponse({
    status: 200,
    description: 'Exercises retrieved successfully',
    type: ExerciseListDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: ExerciseQueryDto): Promise<ExerciseListDto> {
    return this.exercisesService.findAll(query);
  }

  /**
   * Retrieve a single exercise by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve exercise details' })
  @ApiResponse({
    status: 200,
    description: 'Exercise retrieved successfully',
    type: ExerciseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ExerciseDto> {
    return this.exercisesService.findOne(id);
  }
}

