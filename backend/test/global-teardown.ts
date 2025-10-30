import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Global teardown for E2E tests
 * Runs once after all tests to clean up database state
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  // Detect if we're in CI environment
  const isCI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Load test environment variables from .env.test
  // In CI: don't override (use CI-provided variables)
  // Locally: override to ensure test database is used
  const envTestPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: envTestPath, override: !isCI });

  console.log(`🗄️  Cleaning database: ${process.env.DB_NAME || 'NOT SET'}`);

  // Safety check: ensure DB_NAME is set
  const dbName = process.env.DB_NAME;
  if (!dbName) {
    console.error('❌ DB_NAME is not set - skipping cleanup');
    return;
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
      `❌ DANGER: Attempting to clean suspicious database: ${dbName}`,
    );
    console.error(
      `❌ This database name contains a potentially dangerous keyword.`,
    );
    console.error('❌ Skipping cleanup to prevent data loss!');
    return;
  }

  try {
    // Create a fresh data source with current environment variables
    // DO NOT import AppDataSource as it loads .env at import time
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
    await dataSource.query('DELETE FROM exercise_sets');
    await dataSource.query('DELETE FROM session_exercises');
    await dataSource.query('DELETE FROM workout_sessions');
    await dataSource.query('DELETE FROM plan_exercises');
    await dataSource.query('DELETE FROM workout_plans');
    await dataSource.query('DELETE FROM user_oauth_providers');
    await dataSource.query('DELETE FROM users');

    await dataSource.destroy();

    console.log('✅ Test environment cleaned up\n');
  } catch (error) {
    console.error('❌ Failed to clean up test environment:', error);
    // Don't throw, as this is cleanup
  }
}
