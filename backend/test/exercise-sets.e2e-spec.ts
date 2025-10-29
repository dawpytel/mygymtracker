/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  validExerciseSet,
  validWarmupSet,
  invalidExerciseSet_SetIndex,
  invalidExerciseSet_Reps,
  invalidExerciseSet_Load,
} from './mock-data';
import { SetType } from '../src/types';
import {
  ExerciseSetResponse,
  WorkoutSessionResponse,
  SessionExerciseResponse,
} from './test-types';

describe('Exercise Sets (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let sessionId: string;
  let sessionExerciseId: string;
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

    // Create test exercises and workout plan
    exerciseIds = await createTestExercises(app);
    const plan = await createTestWorkoutPlan(app, accessToken, exerciseIds);

    // Create a workout session
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

    const sessionBody = sessionDetails.body as WorkoutSessionResponse;
    sessionExerciseId = sessionBody.exercises[0].id;
  });

  describe('POST /sessions/:sessionId/exercises/:exerciseId/sets', () => {
    it('should create a working set with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validExerciseSet)
        .expect(201);

      const body = response.body as ExerciseSetResponse;

      // Validate response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('set_type');
      expect(body).toHaveProperty('set_index');
      expect(body).toHaveProperty('reps');
      expect(body).toHaveProperty('load');
      expect(body).toHaveProperty('created_at');

      // Validate data types and values
      expect(isValidUUID(body.id)).toBe(true);
      expect(body.set_type).toBe(SetType.WORKING);
      expect(body.set_index).toBe(validExerciseSet.set_index);
      expect(body.reps).toBe(validExerciseSet.reps);
      expect(body.load).toBe(validExerciseSet.load);
      expect(isValidISODate(body.created_at)).toBe(true);
    });

    it('should create a warmup set', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validWarmupSet)
        .expect(201);

      const body = response.body as ExerciseSetResponse;
      expect(body.set_type).toBe(SetType.WARMUP);
      expect(body.reps).toBe(validWarmupSet.reps);
      expect(body.load).toBe(validWarmupSet.load);
    });

    it('should create a set with zero load (bodyweight)', async () => {
      const bodyweightSet = {
        set_type: SetType.WORKING,
        set_index: 1,
        reps: 15,
        load: 0,
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bodyweightSet)
        .expect(201);

      const body = response.body as ExerciseSetResponse;
      expect(body.load).toBe(0);
    });

    it('should create a set with decimal load', async () => {
      const decimalLoadSet = {
        set_type: SetType.WORKING,
        set_index: 1,
        reps: 10,
        load: 82.5,
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(decimalLoadSet)
        .expect(201);

      const body = response.body as ExerciseSetResponse;
      expect(body.load).toBe(82.5);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .send(validExerciseSet)
        .expect(401);
    });

    it('should reject set with missing set_type', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_index: 1,
          reps: 10,
          load: 80.5,
        })
        .expect(400);
    });

    it('should reject set with invalid set_type', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: 'invalid_type',
          set_index: 1,
          reps: 10,
          load: 80.5,
        })
        .expect(400);
    });

    it('should reject set with set_index less than 1', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidExerciseSet_SetIndex)
        .expect(400);
    });

    it('should reject set with reps less than 1', async () => {
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

    it('should reject set with missing reps', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 1,
          load: 80.5,
        })
        .expect(400);
    });

    it('should reject set with missing load', async () => {
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 1,
          reps: 10,
        })
        .expect(400);
    });

    it('should create multiple sets for same exercise', async () => {
      // Create first set
      const set1 = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 1 })
        .expect(201);

      // Create second set
      const set2 = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 2 })
        .expect(201);

      // Create third set
      const set3 = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 3 })
        .expect(201);

      const set1Body = set1.body as ExerciseSetResponse;
      const set2Body = set2.body as ExerciseSetResponse;
      const set3Body = set3.body as ExerciseSetResponse;

      // Verify all sets are different
      expect(set1Body.id).not.toBe(set2Body.id);
      expect(set2Body.id).not.toBe(set3Body.id);

      // Verify all sets exist in session
      const sessionDetails = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const sessionBody = sessionDetails.body as WorkoutSessionResponse;
      const exercise = sessionBody.exercises.find(
        (e: SessionExerciseResponse) => e.id === sessionExerciseId,
      );
      if (exercise) {
        expect(exercise.sets.length).toBe(3);
      }
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .post(`/sessions/${nonExistentId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validExerciseSet)
        .expect(404);
    });

    it('should return 404 for non-existent exercise', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${nonExistentId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validExerciseSet)
        .expect(404);
    });

    it('should return 403 when creating set in another user session', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to create set in User 1's session
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send(validExerciseSet)
        .expect(403);
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

      const setBody = setResponse.body as ExerciseSetResponse;
      setId = setBody.id;
    });

    it('should update set reps', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reps: 12 })
        .expect(200);

      const body = response.body as ExerciseSetResponse;
      expect(body.id).toBe(setId);
      expect(body.reps).toBe(12);
      // Other fields should remain unchanged
      expect(parseFloat(String(body.load))).toBe(validExerciseSet.load);
      expect(body.set_type).toBe(validExerciseSet.set_type);
    });

    it('should update set load', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ load: 90.0 })
        .expect(200);

      const body = response.body as ExerciseSetResponse;
      expect(body.id).toBe(setId);
      expect(body.load).toBe(90.0);
      // Other fields should remain unchanged
      expect(body.reps).toBe(validExerciseSet.reps);
    });

    it('should update set type', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ set_type: SetType.WARMUP })
        .expect(200);

      const body = response.body as ExerciseSetResponse;
      expect(body.id).toBe(setId);
      expect(body.set_type).toBe(SetType.WARMUP);
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reps: 15,
          load: 95.5,
          set_type: SetType.WARMUP,
        })
        .expect(200);

      const body = response.body as ExerciseSetResponse;
      expect(body.reps).toBe(15);
      expect(body.load).toBe(95.5);
      expect(body.set_type).toBe(SetType.WARMUP);
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .send({ reps: 12 })
        .expect(401);
    });

    it('should reject update with invalid reps', async () => {
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reps: 0 })
        .expect(400);
    });

    it('should reject update with negative load', async () => {
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ load: -10 })
        .expect(400);
    });

    it('should reject update with invalid set_type', async () => {
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ set_type: 'invalid_type' })
        .expect(400);
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

    it('should return 403 when updating set in another user session', async () => {
      // Register second user
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // User 2 tries to update User 1's set
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ reps: 12 })
        .expect(403);
    });

    it('should maintain created_at timestamp after update', async () => {
      // Get original set data
      const originalSession = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const originalSessionBody =
        originalSession.body as WorkoutSessionResponse;
      const originalSet = originalSessionBody.exercises[0].sets.find(
        (s: ExerciseSetResponse) => s.id === setId,
      );
      const originalCreatedAt = originalSet?.created_at;

      // Update the set
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reps: 12 })
        .expect(200);

      // Get updated set data
      const updatedSession = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const updatedSessionBody = updatedSession.body as WorkoutSessionResponse;
      const updatedSet = updatedSessionBody.exercises[0].sets.find(
        (s: ExerciseSetResponse) => s.id === setId,
      );

      // created_at should remain the same
      expect(updatedSet?.created_at).toBe(originalCreatedAt);
    });
  });

  describe('Exercise Set Workflow', () => {
    it('should support typical workout logging workflow', async () => {
      // Create warmup sets
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WARMUP,
          set_index: 1,
          reps: 10,
          load: 40.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WARMUP,
          set_index: 2,
          reps: 8,
          load: 60.0,
        })
        .expect(201);

      // Create working sets
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 1,
          reps: 10,
          load: 80.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 2,
          reps: 9,
          load: 80.0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 3,
          reps: 8,
          load: 80.0,
        })
        .expect(201);

      // Verify all sets are logged
      const sessionDetails = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const sessionBody = sessionDetails.body as WorkoutSessionResponse;
      const exercise = sessionBody.exercises[0];
      expect(exercise.sets.length).toBe(5);

      const warmupSets = exercise.sets.filter(
        (s: ExerciseSetResponse) => s.set_type === (SetType.WARMUP as string),
      );
      const workingSets = exercise.sets.filter(
        (s: ExerciseSetResponse) => s.set_type === (SetType.WORKING as string),
      );

      expect(warmupSets.length).toBe(2);
      expect(workingSets.length).toBe(3);
    });

    it('should allow correcting a set after creation', async () => {
      // Create a set with wrong data
      const setResponse = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          set_type: SetType.WORKING,
          set_index: 1,
          reps: 10,
          load: 80.0,
        })
        .expect(201);

      const setBody = setResponse.body as ExerciseSetResponse;

      // Correct the reps (user miscounted)
      await request(app.getHttpServer())
        .patch(
          `/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setBody.id}`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reps: 11 })
        .expect(200);

      // Verify correction
      const sessionDetails = await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const sessionBody = sessionDetails.body as WorkoutSessionResponse;
      const correctedSet = sessionBody.exercises[0].sets.find(
        (s: ExerciseSetResponse) => s.id === setBody.id,
      );
      expect(correctedSet?.reps).toBe(11);
    });

    it('should track sets chronologically by created_at', async () => {
      // Create sets with small delays
      const set1Response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 1 })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const set2Response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 2 })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const set3Response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validExerciseSet, set_index: 3 })
        .expect(201);

      const set1Body = set1Response.body as ExerciseSetResponse;
      const set2Body = set2Response.body as ExerciseSetResponse;
      const set3Body = set3Response.body as ExerciseSetResponse;

      // Verify chronological order
      const created1 = new Date(set1Body.created_at).getTime();
      const created2 = new Date(set2Body.created_at).getTime();
      const created3 = new Date(set3Body.created_at).getTime();

      expect(created2).toBeGreaterThanOrEqual(created1);
      expect(created3).toBeGreaterThanOrEqual(created2);
    });
  });
});
