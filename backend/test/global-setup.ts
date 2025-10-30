import { DataSource } from 'typeorm';
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
  // In CI: don't override (use CI-provided variables from GitHub Environment secrets)
  // Locally: override to ensure test database from .env.test is used
  const envTestPath = path.resolve(__dirname, '../.env.test');
  const result = dotenv.config({ path: envTestPath, override: !isCI });

  if (result.parsed) {
    console.log(`📁 Loaded test configuration from: ${envTestPath}`);
    console.log(
      `🔧 Mode: ${isCI ? 'CI (using GitHub Environment secrets)' : 'Local (using .env.test)'}`,
    );
  } else if (!isCI) {
    console.error(`❌ .env.test file not found at: ${envTestPath}`);
    throw new Error('.env.test file is required for local E2E tests');
  } else {
    console.log('📁 CI mode: using GitHub Environment secrets');
  }

  console.log(`🗄️  Test database: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`🔧 Database host: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'NOT SET'}`);

  // Safety check: ensure DB_NAME is set
  const dbName = process.env.DB_NAME;

  if (!dbName) {
    console.error('❌ DB_NAME is not set in environment variables');
    throw new Error('DB_NAME must be set for E2E tests');
  }

  // Safety check: warn if database name looks suspicious
  const suspiciousNames = [
    'myapp_dev',
    'myapp_prod',
    'postgres',
    'production',
    'prod',
  ];
  if (suspiciousNames.some((name) => dbName.toLowerCase().includes(name))) {
    console.error(
      `❌ DANGER: Attempting to run E2E tests against suspicious database: ${dbName}`,
    );
    console.error(
      `❌ This database name contains a potentially dangerous keyword.`,
    );
    throw new Error(
      `E2E tests should use a dedicated test database, not ${dbName}`,
    );
  }

  try {
    // Create fresh data source with test environment variables
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME!,
      // No entities needed for cleanup
      synchronize: false,
    });

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
