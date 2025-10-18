import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise } from './entities/session-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutPlan } from '../workout-plans/entities/workout-plan.entity';

/**
 * SessionsModule - handles workout session management
 * Provides endpoints for creating, listing, and managing workout sessions
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutSession,
      SessionExercise,
      ExerciseSet,
      WorkoutPlan,
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

