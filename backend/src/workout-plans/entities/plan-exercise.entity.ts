import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkoutPlan } from './workout-plan.entity';
import { IntensityTechnique } from '../../types';

/**
 * PlanExercise entity - represents an exercise within a workout plan
 * Maps to the plan_exercises database table
 */
@Entity('plan_exercises')
export class PlanExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({ type: 'uuid' })
  exercise_id: string;

  @Column({ type: 'int' })
  display_order: number;

  @Column({
    type: 'enum',
    enum: IntensityTechnique,
  })
  intensity_technique: IntensityTechnique;

  @Column({ type: 'smallint' })
  warmup_sets: number;

  @Column({ type: 'smallint' })
  working_sets: number;

  @Column({ type: 'smallint' })
  target_reps: number;

  @Column({ type: 'smallint' })
  rpe_early: number;

  @Column({ type: 'smallint' })
  rpe_last: number;

  @Column({ type: 'int' })
  rest_time: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  notes: string;

  @ManyToOne(() => WorkoutPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  workout_plan: WorkoutPlan;
}

