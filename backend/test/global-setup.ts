import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/db/data-source';

/**
 * Global setup for E2E tests
 * Runs once before all tests to ensure clean database state
 */
export default async function globalSetup() {
  console.log('\n🧹 Setting up test environment...\n');
  
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

