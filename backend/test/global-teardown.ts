import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/db/data-source';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Global teardown for E2E tests
 * Runs once after all tests to clean up database state
 */
export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  // Load test environment variables from .env.test
  const envTestPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: envTestPath, override: true });

  try {
    // Initialize data source
    const dataSource = new DataSource(AppDataSource.options);
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
