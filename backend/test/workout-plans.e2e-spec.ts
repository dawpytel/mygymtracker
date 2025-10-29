/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  registerTestUser,
  createTestExercises,
  isValidUUID,
  isValidISODate,
} from './test-utils';
import {
  testUsers,
  createValidWorkoutPlan,
  validPlanExercise,
  minimalPlanExercise,
  invalidPlanExercise_WorkingSets,
  invalidPlanExercise_RPE,
  invalidPlanExercise_Reps,
  invalidPlanExercise_NotesTooLong,
  invalidWorkoutPlan_NameTooLong,
  invalidWorkoutPlan_EmptyName,
} from './mock-data';
import { WorkoutPlanResponse } from './test-types';

describe('Workout Plans (e2e)', () => {
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

  describe('POST /plans', () => {
    it('should create a new workout plan with exercises', async () => {
      const planData = createValidWorkoutPlan(exerciseIds);

      console.log('Exercise IDs:', exerciseIds);
      console.log('Plan data:', JSON.stringify(planData, null, 2));

      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData);

      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      const body = response.body as WorkoutPlanResponse;

      // Validate response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('plan_name');
      expect(body).toHaveProperty('exercises');
      expect(isValidUUID(body.id)).toBe(true);
      expect(body.plan_name).toBe(planData.plan_name);
      expect(Array.isArray(body.exercises)).toBe(true);
      expect(body.exercises.length).toBe(2);

      // Validate exercise structure
      const exercise = body.exercises[0];
      expect(exercise).toHaveProperty('id');
      expect(exercise).toHaveProperty('exercise_id');
      expect(exercise).toHaveProperty('exercise_name');
      expect(exercise).toHaveProperty('display_order');
      expect(exercise).toHaveProperty('intensity_technique');
      expect(exercise).toHaveProperty('warmup_sets');
      expect(exercise).toHaveProperty('working_sets');
      expect(exercise).toHaveProperty('target_reps');
      expect(exercise).toHaveProperty('rpe_early');
      expect(exercise).toHaveProperty('rpe_last');
      expect(exercise).toHaveProperty('rest_time');
      expect(exercise).toHaveProperty('notes');
    });

    it('should create a plan with minimal valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: exerciseIds.benchPressId,
              ...minimalPlanExercise,
            },
          ],
        })
        .expect(201);

      expect(response.body.plan_name).toBe('Test Plan');
      expect(response.body.exercises.length).toBe(1);
    });

    it('should create a plan with no exercises', async () => {
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Empty Plan',
          exercises: [],
        })
        .expect(201);

      expect(response.body.plan_name).toBe('Empty Plan');
      expect(response.body.exercises).toEqual([]);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .send(createValidWorkoutPlan(exerciseIds))
        .expect(401);
    });

    it('should reject plan with empty name', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidWorkoutPlan_EmptyName)
        .expect(400);
    });

    it('should reject plan with name too long', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidWorkoutPlan_NameTooLong)
        .expect(400);
    });

    it('should reject plan with working_sets above maximum', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: exerciseIds.benchPressId,
              ...invalidPlanExercise_WorkingSets,
            },
          ],
        })
        .expect(400);
    });

    it('should reject plan with invalid RPE values', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: exerciseIds.benchPressId,
              ...invalidPlanExercise_RPE,
            },
          ],
        })
        .expect(400);
    });

    it('should reject plan with invalid target_reps', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: exerciseIds.benchPressId,
              ...invalidPlanExercise_Reps,
            },
          ],
        })
        .expect(400);
    });

    it('should reject plan with notes too long', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: exerciseIds.benchPressId,
              ...invalidPlanExercise_NotesTooLong,
            },
          ],
        })
        .expect(400);
    });

    it('should reject plan with invalid exercise_id format', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Test Plan',
          exercises: [
            {
              exercise_id: 'invalid-uuid',
              ...validPlanExercise,
            },
          ],
        })
        .expect(400);
    });
  });

  describe('GET /plans', () => {
    it('should return empty list when user has no plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return list of user plans', async () => {
      // Create two plans
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createValidWorkoutPlan(exerciseIds))
        .expect(201);

      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Pull Day',
          exercises: [],
        })
        .expect(201);

      // Get plans list
      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.items.length).toBe(2);

      // Validate list item structure
      const item = response.body.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('plan_name');
      expect(item).toHaveProperty('created_at');
      expect(isValidUUID(item.id)).toBe(true);
      expect(isValidISODate(item.created_at)).toBe(true);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).get('/plans').expect(401);
    });

    it('should support pagination with limit', async () => {
      // Create 3 plans
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/plans')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            plan_name: `Plan ${i + 1}`,
            exercises: [],
          })
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/plans')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should support pagination with offset', async () => {
      // Create 3 plans
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/plans')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            plan_name: `Plan ${i + 1}`,
            exercises: [],
          })
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/plans')
        .query({ limit: 2, offset: 1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should only return plans belonging to the authenticated user', async () => {
      // User 1 creates a plan
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'User 1 Plan',
          exercises: [],
        })
        .expect(201);

      // User 2 creates a plan
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({
          plan_name: 'User 2 Plan',
          exercises: [],
        })
        .expect(201);

      // User 1 should only see their plan
      const user1Plans = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(user1Plans.body.total).toBe(1);
      expect(user1Plans.body.items[0].plan_name).toBe('User 1 Plan');

      // User 2 should only see their plan
      const user2Plans = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      expect(user2Plans.body.total).toBe(1);
      expect(user2Plans.body.items[0].plan_name).toBe('User 2 Plan');
    });
  });

  describe('GET /plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a plan for testing
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createValidWorkoutPlan(exerciseIds))
        .expect(201);

      planId = response.body.id;
    });

    it('should return plan with exercises', async () => {
      const response = await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('plan_name');
      expect(response.body).toHaveProperty('exercises');
      expect(response.body.id).toBe(planId);
      expect(Array.isArray(response.body.exercises)).toBe(true);
      expect(response.body.exercises.length).toBe(2);

      // Exercises should be ordered by display_order
      expect(response.body.exercises[0].display_order).toBe(0);
      expect(response.body.exercises[1].display_order).toBe(1);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).get(`/plans/${planId}`).expect(401);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .get(`/plans/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when accessing another user plan', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to access User 1's plan
      await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });
  });

  describe('PUT /plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a plan for testing
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createValidWorkoutPlan(exerciseIds))
        .expect(201);

      planId = response.body.id;
    });

    it('should update plan name', async () => {
      const response = await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Updated Plan Name',
        })
        .expect(200);

      expect(response.body.plan_name).toBe('Updated Plan Name');
      expect(response.body.id).toBe(planId);
    });

    it('should update plan name and exercises', async () => {
      const response = await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Updated Plan',
          exercises: [
            {
              exercise_id: exerciseIds.deadliftId,
              ...validPlanExercise,
              display_order: 0,
            },
          ],
        })
        .expect(200);

      expect(response.body.plan_name).toBe('Updated Plan');
      expect(response.body.exercises.length).toBe(1);
      expect(response.body.exercises[0].exercise_id).toBe(
        exerciseIds.deadliftId,
      );
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .send({
          plan_name: 'Updated Plan',
        })
        .expect(401);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .put(`/plans/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'Updated Plan',
        })
        .expect(404);
    });

    it('should return 403 when updating another user plan', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to update User 1's plan
      await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({
          plan_name: 'Hacked Plan',
        })
        .expect(403);
    });

    it('should reject update with empty plan name', async () => {
      await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: '',
        })
        .expect(400);
    });

    it('should reject update with plan name too long', async () => {
      await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plan_name: 'x'.repeat(101),
        })
        .expect(400);
    });
  });

  describe('DELETE /plans/:id', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a plan for testing
      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createValidWorkoutPlan(exerciseIds))
        .expect(201);

      planId = response.body.id;
    });

    it('should delete a plan', async () => {
      await request(app.getHttpServer())
        .delete(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify plan is deleted
      await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).delete(`/plans/${planId}`).expect(401);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .delete(`/plans/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when deleting another user plan', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to delete User 1's plan
      await request(app.getHttpServer())
        .delete(`/plans/${planId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);

      // Verify plan still exists for User 1
      await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should delete plan and all associated exercises', async () => {
      await request(app.getHttpServer())
        .delete(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify plan and exercises are deleted
      await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
