import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { WorkoutSession } from './entities/workout-session.entity';
import { SessionExercise } from './entities/session-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutPlan } from '../workout-plans/entities/workout-plan.entity';
import { PlanExercise } from '../workout-plans/entities/plan-exercise.entity';
import { WarmupService } from '../common/warmup/warmup.service';

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
      PlanExercise,
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, WarmupService],
  exports: [SessionsService],
})
export class SessionsModule {}

