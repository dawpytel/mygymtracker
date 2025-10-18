import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Exercise entity - represents a predefined exercise in the system
 * Corresponds to the exercises table in the database
 */
@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}

