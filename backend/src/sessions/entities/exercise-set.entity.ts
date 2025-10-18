import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SetType } from '../../types';
import { SessionExercise } from './session-exercise.entity';

/**
 * ExerciseSet entity - represents a single set within a session exercise
 * Maps to the exercise_sets database table
 */
@Entity('exercise_sets')
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_exercise_id: string;

  @Column({
    type: 'enum',
    enum: SetType,
  })
  set_type: SetType;

  @Column({ type: 'smallint' })
  set_index: number;

  @Column({ type: 'smallint' })
  reps: number;

  @Column({ type: 'decimal', precision: 5, scale: 1 })
  load: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @ManyToOne(() => SessionExercise, (exercise) => exercise.exercise_sets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_exercise_id' })
  session_exercise: SessionExercise;
}

