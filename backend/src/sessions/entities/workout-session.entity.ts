import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SessionStatus } from '../../types';
import { SessionExercise } from './session-exercise.entity';
import { WorkoutPlan } from '../../workout-plans/entities/workout-plan.entity';

/**
 * WorkoutSession entity - represents an actual workout session
 * Maps to the workout_sessions database table
 */
@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @Column({
    type: 'enum',
    enum: SessionStatus,
  })
  status: SessionStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at: Date | null;

  // Relations
  @OneToMany(() => SessionExercise, (exercise) => exercise.session, {
    cascade: true,
  })
  session_exercises: SessionExercise[];

  @ManyToOne(() => WorkoutPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: WorkoutPlan | null;
}

