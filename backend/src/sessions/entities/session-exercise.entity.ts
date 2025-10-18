import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { WorkoutSession } from './workout-session.entity';
import { ExerciseSet } from './exercise-set.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

/**
 * SessionExercise entity - represents an exercise performed in a session
 * Maps to the session_exercises database table
 */
@Entity('session_exercises')
export class SessionExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'uuid', nullable: true })
  plan_exercise_id: string | null;

  @Column({ type: 'uuid' })
  exercise_id: string;

  @Column({ type: 'int' })
  display_order: number;

  @Column({ type: 'varchar', length: 500, default: '' })
  notes: string;

  // Relations
  @ManyToOne(() => WorkoutSession, (session) => session.session_exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: WorkoutSession;

  @OneToMany(() => ExerciseSet, (set) => set.session_exercise, {
    cascade: true,
  })
  exercise_sets: ExerciseSet[];

  @ManyToOne(() => Exercise)
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;
}

