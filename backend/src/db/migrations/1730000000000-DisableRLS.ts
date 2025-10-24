import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Temporarily disable Row-Level Security policies
 *
 * This migration disables RLS to allow the application to function
 * while we implement a proper RLS solution that works with TypeORM
 * connection pooling without causing memory leaks.
 *
 * TODO: Re-enable RLS once we have a stable implementation
 */
export class DisableRLS1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Disable RLS on all tables
    await queryRunner.query(
      `ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE plan_exercises DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE session_exercises DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE exercise_sets DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE user_oauth_providers DISABLE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-enable RLS on all tables
    await queryRunner.query(
      `ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE user_oauth_providers ENABLE ROW LEVEL SECURITY`,
    );
  }
}
