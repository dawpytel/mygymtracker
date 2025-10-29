import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { ExerciseQueryDto, ExerciseListDto, ExerciseDto } from '../types';

/**
 * Service for managing exercises
 * Provides read-only operations for exercise data
 */
@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
  ) {}

  /**
   * Find all exercises with optional search and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of exercises
   */
  async findAll(query: ExerciseQueryDto): Promise<ExerciseListDto> {
    const { limit = 10, offset = 0, search } = query;

    // Defensive validation (class-validator should catch these, but defensive)
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    try {
      // Build where clause for search
      const whereClause = search ? { name: ILike(`%${search}%`) } : {};

      const [items, total] = await this.exerciseRepository.findAndCount({
        where: whereClause,
        take: limit,
        skip: offset,
        order: { name: 'ASC' },
      });

      return {
        items: items.map((item) => this.toDto(item)),
        total,
      };
    } catch (error) {
      // Log error with context
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to fetch exercises', errorStack);
      throw new InternalServerErrorException('Failed to retrieve exercises');
    }
  }

  /**
   * Find a single exercise by ID
   * @param id - Exercise UUID
   * @returns Exercise details
   * @throws NotFoundException if exercise doesn't exist
   */
  async findOne(id: string): Promise<ExerciseDto> {
    // Early return pattern for error handling
    if (!id) {
      throw new BadRequestException('Exercise ID is required');
    }

    try {
      const exercise = await this.exerciseRepository.findOneBy({ id });

      // Guard clause: check if exercise exists
      if (!exercise) {
        throw new NotFoundException(`Exercise with ID ${id} not found`);
      }

      // Happy path last
      return this.toDto(exercise);
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch exercise ${id}`, errorStack);
      throw new InternalServerErrorException('Failed to retrieve exercise');
    }
  }

  /**
   * Transform Exercise entity to DTO
   * @param exercise - Exercise entity from database
   * @returns Exercise DTO for API response
   */
  private toDto(exercise: Exercise): ExerciseDto {
    return {
      id: exercise.id,
      name: exercise.name,
    };
  }
}
