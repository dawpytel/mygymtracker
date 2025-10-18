import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutPlansController } from './workout-plans.controller';
import { WorkoutPlansService } from './workout-plans.service';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { PlanExercise } from './entities/plan-exercise.entity';

/**
 * WorkoutPlansModule - handles workout plan management
 * Provides endpoints for creating, viewing, updating, and deleting workout plans
 */
@Module({
  imports: [TypeOrmModule.forFeature([WorkoutPlan, PlanExercise])],
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService],
  exports: [WorkoutPlansService],
})
export class WorkoutPlansModule {}
