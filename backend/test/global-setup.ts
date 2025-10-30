import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/db/data-source';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Global setup for E2E tests
 * Runs once before all tests to ensure clean database state
 */
export default async function globalSetup() {
  console.log('\n🧹 Setting up test environment...\n');

  // Detect if we're in CI environment (GitHub Actions, etc.)
  const isCI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Load test environment variables from .env.test
  // In CI: don't override (use CI-provided variables)
  // Locally: override to ensure test database is used
  const envTestPath = path.resolve(__dirname, '../.env.test');
  const result = dotenv.config({ path: envTestPath, override: !isCI });

  if (result.parsed) {
    console.log(`📁 Loaded test configuration from: ${envTestPath}`);
    console.log(
      `🔧 Mode: ${isCI ? 'CI (respecting CI env vars)' : 'Local (override enabled)'}`,
    );
  } else {
    console.log(
      `📁 Using environment variables (${isCI ? 'CI mode' : 'env file not found'})`,
    );
  }

  console.log(`🗄️  Test database: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`🔧 Database host: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'NOT SET'}`);

  // Safety check: ensure we're not running against production or development database
  const dbName = process.env.DB_NAME;

  if (!dbName) {
    console.error('❌ DB_NAME is not set in environment variables');
    throw new Error('DB_NAME must be set for E2E tests');
  }

  // Safety check: ensure we're using the test database
  if (dbName === 'myapp_dev' || dbName === 'myapp_prod') {
    console.error(
      `❌ DANGER: Attempting to run E2E tests against ${dbName} database!`,
    );
    throw new Error(`E2E tests must use myapp_e2e database, not ${dbName}`);
  }

  try {
    // Initialize data source
    const dataSource = new DataSource(AppDataSource.options);
    await dataSource.initialize();

    // Clean all tables in reverse order of dependencies
    console.log('Cleaning database tables...');
    await dataSource.query('DELETE FROM exercise_sets');
    await dataSource.query('DELETE FROM session_exercises');
    await dataSource.query('DELETE FROM workout_sessions');
    await dataSource.query('DELETE FROM plan_exercises');
    await dataSource.query('DELETE FROM workout_plans');
    await dataSource.query('DELETE FROM user_oauth_providers');
    await dataSource.query('DELETE FROM users');

    // Ensure test exercises exist
    console.log('Ensuring test exercises exist...');
    await dataSource.query(
      `INSERT INTO exercises (name) VALUES ('Bench Press') 
       ON CONFLICT (name) DO NOTHING`,
    );
    await dataSource.query(
      `INSERT INTO exercises (name) VALUES ('Squat')
       ON CONFLICT (name) DO NOTHING`,
    );
    await dataSource.query(
      `INSERT INTO exercises (name) VALUES ('Deadlift')
       ON CONFLICT (name) DO NOTHING`,
    );

    await dataSource.destroy();

    console.log('✅ Test environment ready\n');
  } catch (error) {
    console.error('❌ Failed to set up test environment:', error);
    throw error;
  }
}
