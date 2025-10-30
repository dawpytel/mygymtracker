import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add created_at and updated_at timestamps to user_oauth_providers table
 * These columns are used by TypeORM decorators @CreateDateColumn and @UpdateDateColumn
 */
export class AddOAuthTimestamps1730300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_oauth_providers
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN updated_at TIMESTAMPTZ
    `);

    // Create index for timestamp queries (optional but recommended)
    await queryRunner.query(`
      CREATE INDEX idx_oauth_providers_created
      ON user_oauth_providers (user_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_oauth_providers_created
    `);

    await queryRunner.query(`
      ALTER TABLE user_oauth_providers
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS created_at
    `);
  }
}

