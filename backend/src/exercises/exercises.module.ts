import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { Exercise } from './entities/exercise.entity';

/**
 * Module for exercise-related functionality
 * Provides read-only access to exercise catalog
 */
@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService], // Export for use in other modules (e.g., workout plans)
})
export class ExercisesModule {}
