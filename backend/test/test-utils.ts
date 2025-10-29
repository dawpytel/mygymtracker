/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
  RegisterResponse,
  LoginResponse,
  WorkoutPlanResponse,
  WorkoutSessionResponse,
  ErrorResponse,
} from './test-types';

/**
 * Test utilities for E2E tests
 */

/**
 * Create a test application instance
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply global validation pipe (same as in main.ts)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  await app.init();

  return app;
}

/**
 * Clean up test database
 * Removes all data from tables in reverse order of dependencies
 */
export async function cleanupDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);

  await dataSource.query('DELETE FROM exercise_sets');
  await dataSource.query('DELETE FROM session_exercises');
  await dataSource.query('DELETE FROM workout_sessions');
  await dataSource.query('DELETE FROM plan_exercises');
  await dataSource.query('DELETE FROM workout_plans');
  await dataSource.query('DELETE FROM user_oauth_providers');
  await dataSource.query('DELETE FROM users');
  // Note: We don't delete exercises as they are predefined
}

/**
 * Register a test user and return access token
 */
export async function registerTestUser(
  app: INestApplication,
  email: string = 'test@example.com',
  password: string = 'testpassword123',
): Promise<{ userId: string; accessToken: string; email: string }> {
  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201);

  const registerBody = registerResponse.body as RegisterResponse;
  const userId = registerBody.id;

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  const loginBody = loginResponse.body as LoginResponse;

  return {
    userId,
    accessToken: loginBody.accessToken,
    email,
  };
}

/**
 * Create exercises in the database for testing
 */
export async function createTestExercises(
  app: INestApplication,
): Promise<{ benchPressId: string; squatId: string; deadliftId: string }> {
  const dataSource = app.get(DataSource);

  // Check if exercises already exist
  const existingExercises = await dataSource.query(
    `SELECT id, name FROM exercises WHERE name IN ('Bench Press', 'Squat', 'Deadlift')`,
  );

  if (existingExercises.length === 3) {
    const benchPress = existingExercises.find((e) => e.name === 'Bench Press');
    const squat = existingExercises.find((e) => e.name === 'Squat');
    const deadlift = existingExercises.find((e) => e.name === 'Deadlift');

    if (!benchPress || !squat || !deadlift) {
      throw new Error('Expected exercises not found');
    }

    return {
      benchPressId: benchPress.id,
      squatId: squat.id,
      deadliftId: deadlift.id,
    };
  }

  // Create test exercises if they don't exist
  const benchPress = await dataSource.query(
    `INSERT INTO exercises (name) VALUES ('Bench Press') 
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
  );
  const squat = await dataSource.query(
    `INSERT INTO exercises (name) VALUES ('Squat')
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
  );
  const deadlift = await dataSource.query(
    `INSERT INTO exercises (name) VALUES ('Deadlift')
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
  );

  return {
    benchPressId: benchPress[0].id,
    squatId: squat[0].id,
    deadliftId: deadlift[0].id,
  };
}

/**
 * Create a test workout plan
 */
export async function createTestWorkoutPlan(
  app: INestApplication,
  accessToken: string,
  exercises: { benchPressId: string; squatId: string },
): Promise<{ planId: string; planExerciseIds: string[] }> {
  const response = await request(app.getHttpServer())
    .post('/plans')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      plan_name: 'Test Push Day',
      exercises: [
        {
          exercise_id: exercises.benchPressId,
          display_order: 0,
          intensity_technique: 'drop_set',
          warmup_sets: 2,
          working_sets: 3,
          target_reps: 10,
          rpe_early: 7,
          rpe_last: 9,
          rest_time: 120,
          notes: 'Focus on form',
        },
        {
          exercise_id: exercises.squatId,
          display_order: 1,
          intensity_technique: 'N/A',
          warmup_sets: 1,
          working_sets: 4,
          target_reps: 8,
          rpe_early: 8,
          rpe_last: 10,
          rest_time: 180,
          notes: 'Full depth',
        },
      ],
    })
    .expect(201);

  const planBody = response.body as WorkoutPlanResponse;

  return {
    planId: planBody.id,
    planExerciseIds: planBody.exercises.map((e) => e.id),
  };
}

/**
 * Create a test workout session
 */
export async function createTestWorkoutSession(
  app: INestApplication,
  accessToken: string,
  planId: string,
): Promise<{ sessionId: string }> {
  const response = await request(app.getHttpServer())
    .post('/sessions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ plan_id: planId })
    .expect(201);

  const sessionBody = response.body as WorkoutSessionResponse;

  return {
    sessionId: sessionBody.id,
  };
}

/**
 * Extract error message from response
 */
export function getErrorMessage(response: request.Response): string {
  const body = response.body as ErrorResponse;
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  return body.message || body.error || 'Unknown error';
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate ISO date format
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
