import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1728744000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUM types
    await queryRunner.query(`
      CREATE TYPE intensity_technique AS ENUM (
        'drop_set',
        'pause',
        'partial_length',
        'fail',
        'superset',
        'N/A'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE set_type AS ENUM ('warmup', 'working')
    `);

    await queryRunner.query(`
      CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'cancelled')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        account_created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create OAuth providers table
    await queryRunner.query(`
      CREATE TABLE user_oauth_providers (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_name VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_id, provider_name)
      )
    `);

    // Create exercises table
    await queryRunner.query(`
      CREATE TABLE exercises (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);

    // Create workout plans table
    await queryRunner.query(`
      CREATE TABLE workout_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        plan_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ,
        UNIQUE (user_id, plan_name)
      )
    `);

    // Create plan exercises table
    await queryRunner.query(`
      CREATE TABLE plan_exercises (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
        exercise_id UUID NOT NULL REFERENCES exercises(id),
        display_order INT NOT NULL,
        intensity_technique intensity_technique NOT NULL,
        warmup_sets SMALLINT NOT NULL CHECK (warmup_sets >= 0),
        working_sets SMALLINT NOT NULL CHECK (working_sets BETWEEN 0 AND 4),
        target_reps SMALLINT NOT NULL CHECK (target_reps >= 1),
        rpe_early SMALLINT NOT NULL CHECK (rpe_early BETWEEN 1 AND 10),
        rpe_last SMALLINT NOT NULL CHECK (rpe_last BETWEEN 1 AND 10),
        rest_time INT NOT NULL CHECK (rest_time >= 0),
        notes VARCHAR(500) NOT NULL DEFAULT ''
      )
    `);

    // Create workout sessions table
    await queryRunner.query(`
      CREATE TABLE workout_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
        status session_status NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ
      )
    `);

    // Create session exercises table
    await queryRunner.query(`
      CREATE TABLE session_exercises (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
        plan_exercise_id UUID REFERENCES plan_exercises(id) ON DELETE SET NULL,
        exercise_id UUID NOT NULL REFERENCES exercises(id),
        display_order INT NOT NULL,
        notes VARCHAR(500) NOT NULL DEFAULT ''
      )
    `);

    // Create exercise sets table
    await queryRunner.query(`
      CREATE TABLE exercise_sets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
        set_type set_type NOT NULL,
        set_index SMALLINT NOT NULL CHECK (set_index >= 1),
        reps SMALLINT NOT NULL CHECK (reps >= 1),
        load NUMERIC(5,1) NOT NULL CHECK (load >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_workout_sessions_user_completed 
      ON workout_sessions (user_id, completed_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_workout_sessions_plan 
      ON workout_sessions (plan_id)
    `);

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`
      CREATE INDEX idx_exercises_name_trgm 
      ON exercises USING gin (name gin_trgm_ops)
    `);

    // Enable Row-Level Security
    await queryRunner.query(
      `ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY workout_plans_user_policy ON workout_plans
        FOR ALL
        USING (user_id = current_setting('app.user_id')::uuid)
        WITH CHECK (user_id = current_setting('app.user_id')::uuid)
    `);

    await queryRunner.query(
      `ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY plan_exercises_policy ON plan_exercises
        FOR ALL
        USING (EXISTS (
          SELECT 1 FROM workout_plans p
          WHERE p.id = plan_exercises.plan_id
            AND p.user_id = current_setting('app.user_id')::uuid
        ))
    `);

    await queryRunner.query(
      `ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY workout_sessions_policy ON workout_sessions
        FOR ALL
        USING (user_id = current_setting('app.user_id')::uuid)
        WITH CHECK (user_id = current_setting('app.user_id')::uuid)
    `);

    await queryRunner.query(
      `ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY session_exercises_policy ON session_exercises
        FOR ALL
        USING (EXISTS (
          SELECT 1 FROM workout_sessions s
          WHERE s.id = session_exercises.session_id
            AND s.user_id = current_setting('app.user_id')::uuid
        ))
    `);

    await queryRunner.query(
      `ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY exercise_sets_policy ON exercise_sets
        FOR ALL
        USING (EXISTS (
          SELECT 1 FROM session_exercises se
          JOIN workout_sessions s ON se.session_id = s.id
          WHERE exercise_sets.session_exercise_id = se.id
            AND s.user_id = current_setting('app.user_id')::uuid
        ))
    `);

    await queryRunner.query(
      `ALTER TABLE user_oauth_providers ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
      CREATE POLICY user_oauth_policy ON user_oauth_providers
        FOR ALL
        USING (user_id = current_setting('app.user_id')::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop policies
    await queryRunner.query(
      `DROP POLICY IF EXISTS user_oauth_policy ON user_oauth_providers`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS exercise_sets_policy ON exercise_sets`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS session_exercises_policy ON session_exercises`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS workout_sessions_policy ON workout_sessions`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS plan_exercises_policy ON plan_exercises`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS workout_plans_user_policy ON workout_plans`,
    );

    // Disable RLS
    await queryRunner.query(
      `ALTER TABLE user_oauth_providers DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE exercise_sets DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE session_exercises DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE plan_exercises DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exercises_name_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workout_sessions_plan`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_workout_sessions_user_completed`,
    );

    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS exercise_sets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS session_exercises CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS workout_sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS plan_exercises CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS workout_plans CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS exercises CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS user_oauth_providers CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS session_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS set_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS intensity_technique`);

    // Drop extensions
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
