import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PlanExercise } from './plan-exercise.entity';

/**
 * WorkoutPlan entity - represents a user's workout plan template
 * Maps to the workout_plans database table
 */
@Entity('workout_plans')
export class WorkoutPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  plan_name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at: Date | null;

  @OneToMany(() => PlanExercise, (planExercise) => planExercise.workout_plan)
  exercises: PlanExercise[];
}
