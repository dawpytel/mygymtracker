/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  registerTestUser,
  createTestExercises,
  createTestWorkoutPlan,
  createTestWorkoutSession,
  isValidUUID,
  isValidISODate,
} from './test-utils';
import {
  testUsers,
  validStatusUpdates,
  validSessionExerciseUpdate,
  validExerciseSet,
  validWarmupSet,
  invalidExerciseSet_SetIndex,
  invalidExerciseSet_Reps,
  invalidExerciseSet_Load,
} from './mock-data';
import { SessionStatus } from '../src/types';

describe('Workout Sessions (e2e)', () => {
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
    userId = user.userId;

    // Create test exercises
    exerciseIds = await createTestExercises(app);
  });

  describe('POST /sessions', () => {
    let planId: string;

    beforeEach(async () => {
      // Create a workout plan
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      planId = plan.planId;
    });

    it('should create a new workout session from a plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ plan_id: planId })
        .expect(201);

      // Validate response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('started_at');
      expect(isValidUUID(response.body.id)).toBe(true);
      expect(response.body.status).toBe(SessionStatus.IN_PROGRESS);
      expect(isValidISODate(response.body.started_at)).toBe(true);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ plan_id: planId })
        .expect(401);
    });

    it('should reject session creation with non-existent plan_id', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ plan_id: nonExistentId })
        .expect(404);
    });

    it('should reject session creation with invalid plan_id format', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ plan_id: 'invalid-uuid' })
        .expect(400);
    });

    it('should reject session creation with missing plan_id', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /sessions', () => {
    it('should return empty list when user has no sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return list of user sessions', async () => {
      // Create a plan and two sessions
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      await createTestWorkoutSession(app, accessToken, plan.planId);
      await createTestWorkoutSession(app, accessToken, plan.planId);

      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.items.length).toBe(2);

      // Validate list item structure
      const item = response.body.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('started_at');
      expect(item).toHaveProperty('completed_at');
      expect(isValidUUID(item.id)).toBe(true);
      expect(isValidISODate(item.started_at)).toBe(true);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).get('/sessions').expect(401);
    });

    it('should support pagination with limit', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      // Create 3 sessions
      for (let i = 0; i < 3; i++) {
        await createTestWorkoutSession(app, accessToken, plan.planId);
      }

      const response = await request(app.getHttpServer())
        .get('/sessions')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should support pagination with offset', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      // Create 3 sessions
      for (let i = 0; i < 3; i++) {
        await createTestWorkoutSession(app, accessToken, plan.planId);
      }

      const response = await request(app.getHttpServer())
        .get('/sessions')
        .query({ limit: 2, offset: 1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should filter sessions by status=in_progress', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      // Create sessions
      const session1 = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      await createTestWorkoutSession(app, accessToken, plan.planId);

      // Complete one session
      await request(app.getHttpServer())
        .patch(`/sessions/${session1.sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: SessionStatus.COMPLETED })
        .expect(200);

      // Filter by in_progress
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .query({ status: SessionStatus.IN_PROGRESS })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].status).toBe(SessionStatus.IN_PROGRESS);
    });

    it('should filter sessions by status=completed', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      // Create and complete a session
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );

      await request(app.getHttpServer())
        .patch(`/sessions/${session.sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: SessionStatus.COMPLETED })
        .expect(200);

      // Filter by completed
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .query({ status: SessionStatus.COMPLETED })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].status).toBe(SessionStatus.COMPLETED);
    });

    it('should return all sessions when status=all', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

      // Create sessions with different statuses
      const session1 = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      await createTestWorkoutSession(app, accessToken, plan.planId);

      await request(app.getHttpServer())
        .patch(`/sessions/${session1.sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: SessionStatus.COMPLETED })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/sessions')
        .query({ status: 'all' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(2);
    });

    it('should only return sessions belonging to authenticated user', async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      await createTestWorkoutSession(app, accessToken, plan.planId);

      // Register second user and create session
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );
      const plan2 = await createTestWorkoutPlan(
        app,
        user2.accessToken,
        exerciseIds,
      );
      await createTestWorkoutSession(app, user2.accessToken, plan2.planId);

      // User 1 should only see their session
      const user1Sessions = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(user1Sessions.body.total).toBe(1);

      // User 2 should only see their session
      const user2Sessions = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      expect(user2Sessions.body.total).toBe(1);
    });
  });

  describe('GET /sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      sessionId = session.sessionId;
    });

    it('should return session with full details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('started_at');
      expect(response.body).toHaveProperty('completed_at');
      expect(response.body).toHaveProperty('exercises');
      expect(response.body.id).toBe(sessionId);
      expect(Array.isArray(response.body.exercises)).toBe(true);

      // Validate exercise structure with history
      if (response.body.exercises.length > 0) {
        const exercise = response.body.exercises[0];
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('exercise_id');
        expect(exercise).toHaveProperty('exercise_name');
        expect(exercise).toHaveProperty('display_order');
        expect(exercise).toHaveProperty('warmup_sets');
        expect(exercise).toHaveProperty('working_sets');
        expect(exercise).toHaveProperty('target_reps');
        expect(exercise).toHaveProperty('rpe_early');
        expect(exercise).toHaveProperty('rpe_last');
        expect(exercise).toHaveProperty('rest_time');
        expect(exercise).toHaveProperty('intensity_technique');
        expect(exercise).toHaveProperty('notes');
        expect(exercise).toHaveProperty('history');
        expect(exercise).toHaveProperty('sets');
        expect(Array.isArray(exercise.history)).toBe(true);
        expect(Array.isArray(exercise.sets)).toBe(true);
      }
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .get(`/sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when accessing another user session', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to access User 1's session
      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });
  });

  describe('PATCH /sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      sessionId = session.sessionId;
    });

    it('should update session status to completed', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validStatusUpdates.completed)
        .expect(200);

      expect(response.body.status).toBe(SessionStatus.COMPLETED);
      expect(response.body.completed_at).toBeDefined();
      expect(isValidISODate(response.body.completed_at)).toBe(true);
    });

    it('should update session status to cancelled', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validStatusUpdates.cancelled)
        .expect(200);

      expect(response.body.status).toBe(SessionStatus.CANCELLED);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .send(validStatusUpdates.completed)
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .patch(`/sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validStatusUpdates.completed)
        .expect(404);
    });

    it('should return 403 when updating another user session', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to update User 1's session
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send(validStatusUpdates.completed)
        .expect(403);
    });

    it('should reject invalid status value', async () => {
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('DELETE /sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      sessionId = session.sessionId;
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .delete(`/sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when deleting another user session', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to delete User 1's session
      await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);

      // Verify session still exists for User 1
      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('PATCH /sessions/:sessionId/exercises/:exerciseId', () => {
    let sessionId: string;
    let sessionExerciseId: string;

    beforeEach(async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      sessionId = session.sessionId;

      // Get session details to find exercise id
      const sessionDetails = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      sessionExerciseId = sessionDetails.body.exercises[0].id;
    });

    it('should update session exercise notes', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/exercises/${sessionExerciseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validSessionExerciseUpdate)
        .expect(200);

      expect(response.body.notes).toBe(validSessionExerciseUpdate.notes);
      expect(response.body.id).toBe(sessionExerciseId);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/exercises/${sessionExerciseId}`)
        .send(validSessionExerciseUpdate)
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .patch(`/sessions/${nonExistentId}/exercises/${sessionExerciseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validSessionExerciseUpdate)
        .expect(404);
    });

    it('should return 404 for non-existent exercise', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/exercises/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validSessionExerciseUpdate)
        .expect(404);
    });

    it('should return 403 when updating another user session exercise', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to update User 1's session exercise
      await request(app.getHttpServer())
        .patch(`/sessions/${sessionId}/exercises/${sessionExerciseId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send(validSessionExerciseUpdate)
        .expect(403);
    });
  });

  describe('Exercise Sets Management', () => {
    let sessionId: string;
    let sessionExerciseId: string;

    beforeEach(async () => {
      const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);
      const session = await createTestWorkoutSession(
        app,
        accessToken,
        plan.planId,
      );
      sessionId = session.sessionId;

      // Get session details to find exercise id
      const sessionDetails = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      sessionExerciseId = sessionDetails.body.exercises[0].id;
    });

    describe('POST /sessions/:sessionId/exercises/:exerciseId/sets', () => {
      it('should create a new working set', async () => {
        const response = await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validExerciseSet)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('set_type');
        expect(response.body).toHaveProperty('set_index');
        expect(response.body).toHaveProperty('reps');
        expect(response.body).toHaveProperty('load');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body.set_type).toBe(validExerciseSet.set_type);
        expect(response.body.reps).toBe(validExerciseSet.reps);
        expect(response.body.load).toBe(validExerciseSet.load);
      });

      it('should create a warmup set', async () => {
        const response = await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validWarmupSet)
          .expect(201);

        expect(response.body.set_type).toBe(validWarmupSet.set_type);
      });

      it('should reject request without authorization token', async () => {
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .send(validExerciseSet)
          .expect(401);
      });

      it('should reject set with invalid set_index', async () => {
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(invalidExerciseSet_SetIndex)
          .expect(400);
      });

      it('should reject set with invalid reps', async () => {
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(invalidExerciseSet_Reps)
          .expect(400);
      });

      it('should reject set with negative load', async () => {
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(invalidExerciseSet_Load)
          .expect(400);
      });

      it('should create multiple sets for same exercise', async () => {
        // Create first set
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...validExerciseSet, set_index: 1 })
          .expect(201);

        // Create second set
        await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...validExerciseSet, set_index: 2 })
          .expect(201);

        // Verify both sets exist
        const sessionDetails = await request(app.getHttpServer())
          .get(`/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const exercise = sessionDetails.body.exercises.find(
          (e: any) => e.id === sessionExerciseId,
        );
        expect(exercise.sets.length).toBe(2);
      });
    });

    describe('PATCH /sessions/:sessionId/exercises/:exerciseId/sets/:setId', () => {
      let setId: string;

      beforeEach(async () => {
        // Create a set first
        const setResponse = await request(app.getHttpServer())
          .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validExerciseSet)
          .expect(201);

        setId = setResponse.body.id;
      });

      it('should update set data', async () => {
        const response = await request(app.getHttpServer())
          .patch(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reps: 12, load: 85.0 })
          .expect(200);

        expect(response.body.id).toBe(setId);
        expect(response.body.reps).toBe(12);
        expect(response.body.load).toBe(85.0);
      });

      it('should reject request without authorization token', async () => {
        await request(app.getHttpServer())
          .patch(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
          )
          .send({ reps: 12 })
          .expect(401);
      });

      it('should return 404 for non-existent set', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

        await request(app.getHttpServer())
          .patch(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${nonExistentId}`,
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reps: 12 })
          .expect(404);
      });

      it('should reject invalid update data', async () => {
        await request(app.getHttpServer())
          .patch(
            `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ reps: 0 }) // Invalid: reps must be >= 1
          .expect(400);
      });
    });
  });
});
