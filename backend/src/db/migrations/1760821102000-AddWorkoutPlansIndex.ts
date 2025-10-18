import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add performance index for workout plans queries
 * Creates a composite index on (user_id, created_at DESC) for efficient querying
 */
export class AddWorkoutPlansIndex1760821102000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_workout_plans_user_created 
      ON workout_plans (user_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_workout_plans_user_created
    `);
  }
}
