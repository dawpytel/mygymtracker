/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  registerTestUser,
  createTestExercises,
  isValidUUID,
} from './test-utils';
import { testUsers, paginationParams, searchParams } from './mock-data';
import { ExerciseResponse, PaginatedResponse } from './test-types';

describe('Exercises (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let exerciseIds: {
    benchPressId: string;
    squatId: string;
    deadliftId: string;
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase(app);

    // Register a test user and get access token
    const user = await registerTestUser(
      app,
      testUsers.user1.email,
      testUsers.user1.password,
    );
    accessToken = user.accessToken;

    // Create test exercises
    exerciseIds = await createTestExercises(app);
  });

  describe('GET /exercises', () => {
    it('should return list of exercises with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;

      // Validate response structure
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.items)).toBe(true);
      expect(typeof body.total).toBe('number');

      // Validate at least the test exercises exist
      expect(body.total).toBeGreaterThanOrEqual(3);
      expect(body.items.length).toBeGreaterThan(0);

      // Validate exercise structure
      const exercise = body.items[0];
      expect(exercise).toHaveProperty('id');
      expect(exercise).toHaveProperty('name');
      expect(isValidUUID(exercise.id)).toBe(true);
      expect(typeof exercise.name).toBe('string');
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).get('/exercises').expect(401);
    });

    it('should support pagination with limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;
      expect(body.items.length).toBeLessThanOrEqual(2);
    });

    it('should support pagination with offset parameter', async () => {
      // Get first page
      const page1 = await request(app.getHttpServer())
        .get('/exercises')
        .query({ limit: 2, offset: 0 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Get second page
      const page2 = await request(app.getHttpServer())
        .get('/exercises')
        .query({ limit: 2, offset: 2 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const page1Body = page1.body as PaginatedResponse<ExerciseResponse>;
      const page2Body = page2.body as PaginatedResponse<ExerciseResponse>;

      // Items should be different
      if (page1Body.items.length > 0 && page2Body.items.length > 0) {
        expect(page1Body.items[0].id).not.toBe(page2Body.items[0].id);
      }
    });

    it('should use default pagination values when not specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;
      // Default limit is 10 according to types.ts
      expect(body.items.length).toBeLessThanOrEqual(10);
    });

    it('should support search parameter for autocomplete', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query({ search: 'bench' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;

      // Should find Bench Press
      expect(body.total).toBeGreaterThanOrEqual(1);

      // All results should match search term
      body.items.forEach((exercise: ExerciseResponse) => {
        expect(exercise.name.toLowerCase()).toContain('bench');
      });
    });

    it('should support case-insensitive search', async () => {
      const lowerCaseResponse = await request(app.getHttpServer())
        .get('/exercises')
        .query({ search: 'bench' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const upperCaseResponse = await request(app.getHttpServer())
        .get('/exercises')
        .query({ search: 'BENCH' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const lowerBody =
        lowerCaseResponse.body as PaginatedResponse<ExerciseResponse>;
      const upperBody =
        upperCaseResponse.body as PaginatedResponse<ExerciseResponse>;

      expect(lowerBody.total).toBe(upperBody.total);
    });

    it('should return empty array for non-existent search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query({ search: searchParams.nonExistent.search })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should combine search and pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query({ search: 'press', limit: 5, offset: 0 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse<ExerciseResponse>;
      expect(body.items.length).toBeLessThanOrEqual(5);
      body.items.forEach((exercise: ExerciseResponse) => {
        expect(exercise.name.toLowerCase()).toContain('press');
      });
    });

    it('should reject invalid limit (above maximum)', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query(paginationParams.invalidLimit)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject negative offset', async () => {
      const response = await request(app.getHttpServer())
        .get('/exercises')
        .query(paginationParams.negativeOffset)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /exercises/:id', () => {
    it('should return exercise details with valid id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.benchPressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as ExerciseResponse;

      // Validate response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name');

      // Validate data
      expect(body.id).toBe(exerciseIds.benchPressId);
      expect(body.name).toBe('Bench Press');
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.benchPressId}`)
        .expect(401);
    });

    it('should return 404 for non-existent exercise id', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .get(`/exercises/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/exercises/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return different exercises for different ids', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.benchPressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.squatId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body1 = response1.body as ExerciseResponse;
      const body2 = response2.body as ExerciseResponse;

      expect(body1.id).not.toBe(body2.id);
      expect(body1.name).not.toBe(body2.name);
    });

    it('should return same data when requested multiple times', async () => {
      const response1 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.benchPressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.benchPressId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('Exercise Data Accessibility', () => {
    it('should allow multiple users to access same exercises', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 1 gets exercises
      const response1 = await request(app.getHttpServer())
        .get('/exercises')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // User 2 gets exercises
      const response2 = await request(app.getHttpServer())
        .get('/exercises')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      const body1 = response1.body as PaginatedResponse<ExerciseResponse>;
      const body2 = response2.body as PaginatedResponse<ExerciseResponse>;

      // Both users should see the same exercises
      expect(body1.total).toBe(body2.total);
    });

    it('should return consistent exercise list across users', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // Both users get specific exercise
      const response1 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.squatId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get(`/exercises/${exerciseIds.squatId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      // Both should see identical data
      expect(response1.body).toEqual(response2.body);
    });
  });
});
