/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  registerTestUser,
  isValidUUID,
  isValidISODate,
} from './test-utils';
import { testUsers } from './mock-data';
import { UserResponse, LoginResponse } from './test-types';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase(app);
  });

  describe('GET /users/me', () => {
    it('should return current user profile with valid token', async () => {
      const { userId, accessToken, email } = await registerTestUser(
        app,
        testUsers.user1.email,
        testUsers.user1.password,
      );

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as UserResponse;

      // Validate response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('created_at');
      expect(body).toHaveProperty('last_login_at');

      // Validate data
      expect(body.id).toBe(userId);
      expect(body.email).toBe(email);
      expect(isValidUUID(body.id)).toBe(true);
      expect(isValidISODate(body.created_at)).toBe(true);

      // Should not return sensitive fields
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should reject request without authorization token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should return different profiles for different users', async () => {
      const user1 = await registerTestUser(
        app,
        testUsers.user1.email,
        testUsers.user1.password,
      );
      const user2 = await registerTestUser(
        app,
        testUsers.user2.email,
        testUsers.user2.password,
      );

      // Get user1 profile
      const response1 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .expect(200);

      // Get user2 profile
      const response2 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      const body1 = response1.body as UserResponse;
      const body2 = response2.body as UserResponse;

      // Verify different users
      expect(body1.id).not.toBe(body2.id);
      expect(body1.email).toBe(testUsers.user1.email);
      expect(body2.email).toBe(testUsers.user2.email);
    });

    it('should update last_login_at on each login', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      // First login
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const login1Body = login1.body as LoginResponse;

      // Get profile after first login
      const profile1 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${login1Body.accessToken}`)
        .expect(200);

      const profile1Body = profile1.body as UserResponse;
      expect(profile1Body.last_login_at).toBeDefined();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second login
      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const login2Body = login2.body as LoginResponse;

      // Get profile after second login
      const profile2 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${login2Body.accessToken}`)
        .expect(200);

      const profile2Body = profile2.body as UserResponse;

      // last_login_at should be updated
      const lastLogin1 = new Date(profile1Body.last_login_at ?? '');
      const lastLogin2 = new Date(profile2Body.last_login_at ?? '');
      expect(lastLogin2.getTime()).toBeGreaterThanOrEqual(lastLogin1.getTime());
    });
  });

  describe('User Profile Data Integrity', () => {
    it('should maintain profile data consistency across multiple requests', async () => {
      const { accessToken } = await registerTestUser(
        app,
        testUsers.user1.email,
        testUsers.user1.password,
      );

      // Make multiple requests
      const response1 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response3 = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // All responses should be identical
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual(response3.body);
    });
  });
});
