/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  cleanupDatabase,
  isValidUUID,
  isValidISODate,
} from './test-utils';
import { testUsers } from './mock-data';
import { RegisterResponse, LoginResponse, ErrorResponse } from './test-types';

describe('Authentication (e2e)', () => {
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

  describe('POST /auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      const body = response.body as RegisterResponse;

      // Validate response structure
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('created_at');

      // Validate data types
      expect(isValidUUID(body.id)).toBe(true);
      expect(body.email).toBe(testUsers.user1.email);
      expect(isValidISODate(body.created_at)).toBe(true);

      // Should not return password
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.invalidEmail.email,
          password: testUsers.invalidEmail.password,
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toMatch(/email/i);
    });

    it('should reject registration with password less than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.shortPassword.email,
          password: testUsers.shortPassword.password,
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toMatch(/password.*8.*characters/i);
    });

    it('should reject registration with missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          password: testUsers.user1.password,
        })
        .expect(400);
    });

    it('should reject registration with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
        })
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(409);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toMatch(/email.*exists|already/i);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const body = response.body as LoginResponse;

      // Validate response structure
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');

      // Validate tokens are strings
      expect(typeof body.accessToken).toBe('string');
      expect(typeof body.refreshToken).toBe('string');

      // Tokens should be JWT format (3 parts separated by dots)
      expect(body.accessToken.split('.').length).toBe(3);
      expect(body.refreshToken.split('.').length).toBe(3);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUsers.user1.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUsers.user1.password,
        })
        .expect(400);
    });

    it('should reject login with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
        })
        .expect(400);
    });
  });

  describe('POST /auth/oauth/:provider', () => {
    it('should reject OAuth login with invalid provider', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/oauth/invalid-provider')
        .send({
          token: 'some-token',
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toMatch(/provider/i);
    });

    it('should reject OAuth login with missing token', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/google')
        .send({})
        .expect(400);
    });

    // Note: Full OAuth testing would require mocking OAuth providers
    // These are basic validation tests
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const loginBody = loginResponse.body as LoginResponse;
      accessToken = loginBody.accessToken;
    });

    it('should logout with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toMatch(/logged out/i);
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should reject logout with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject logout with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full registration -> login -> logout flow', async () => {
      // Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      const registerBody = registerResponse.body as RegisterResponse;
      expect(isValidUUID(registerBody.id)).toBe(true);

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const loginBody = loginResponse.body as LoginResponse;
      expect(loginBody.accessToken).toBeDefined();

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .expect(200);
    });

    it('should allow multiple logins for same user', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(201);

      // First login
      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const loginBody1 = loginResponse1.body as LoginResponse;

      // Wait 1 second to ensure different timestamp in JWT
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second login
      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.user1.email,
          password: testUsers.user1.password,
        })
        .expect(200);

      const loginBody2 = loginResponse2.body as LoginResponse;

      // Both tokens should be valid but different
      expect(loginBody1.accessToken).not.toBe(loginBody2.accessToken);
    });
  });
});
