# Backend API E2E Test Suite

This directory contains comprehensive End-to-End (E2E) tests for the MyGymTracker API, covering all endpoints defined in the [API Plan](../../../ai/api-plan.md).

## Overview

The test suite validates the complete API functionality including authentication, authorization, data validation, business logic, and error handling across all resources.

## Test Structure

### Test Files

- **`test-utils.ts`** - Shared utility functions for test setup, database cleanup, and common operations
- **`mock-data.ts`** - Mock data and test fixtures following validation rules
- **`auth.e2e-spec.ts`** - Authentication endpoint tests (register, login, OAuth, logout)
- **`users.e2e-spec.ts`** - User profile endpoint tests
- **`exercises.e2e-spec.ts`** - Exercise catalog endpoint tests
- **`workout-plans.e2e-spec.ts`** - Workout plan CRUD operation tests
- **`workout-sessions.e2e-spec.ts`** - Workout session management tests
- **`exercise-sets.e2e-spec.ts`** - Exercise set logging and management tests

### Test Coverage

The test suite covers all endpoints from the API plan:

#### Authentication (`/auth`)

- ✅ POST `/auth/register` - User registration with validation
- ✅ POST `/auth/login` - Email/password authentication
- ✅ POST `/auth/oauth/:provider` - OAuth provider authentication
- ✅ POST `/auth/logout` - Token invalidation

#### Users (`/users`)

- ✅ GET `/users/me` - Current user profile retrieval

#### Exercises (`/exercises`)

- ✅ GET `/exercises` - List exercises with search and pagination
- ✅ GET `/exercises/:id` - Retrieve exercise details

#### Workout Plans (`/plans`)

- ✅ GET `/plans` - List user's workout plans
- ✅ POST `/plans` - Create new workout plan
- ✅ GET `/plans/:id` - Get plan with exercises
- ✅ PUT `/plans/:id` - Update plan
- ✅ DELETE `/plans/:id` - Delete plan

#### Workout Sessions (`/sessions`)

- ✅ GET `/sessions` - List sessions with status filtering
- ✅ POST `/sessions` - Start new workout session
- ✅ GET `/sessions/:id` - Get session with exercises and history
- ✅ PATCH `/sessions/:id` - Update session status
- ✅ DELETE `/sessions/:id` - Cancel session
- ✅ PATCH `/sessions/:sessionId/exercises/:exerciseId` - Update exercise notes
- ✅ POST `/sessions/:sessionId/exercises/:exerciseId/sets` - Log exercise set
- ✅ PATCH `/sessions/:sessionId/exercises/:exerciseId/sets/:setId` - Update set

## Running Tests

### Prerequisites

1. **Ensure PostgreSQL is running**

2. **Create a dedicated test database**

   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create test database
   CREATE DATABASE myapp_e2e;

   # Exit psql
   \q
   ```

3. **Create `.env.test` file in the backend directory**

   ⚠️ **IMPORTANT**: E2E tests will **DELETE ALL DATA** from the database! Use a separate test database.

   Create `backend/.env.test`:

   ```bash
   # Test Environment Configuration
   # WARNING: All data in this database will be DELETED during tests!

   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=myapp_e2e

   JWT_SECRET=test-jwt-secret-key
   JWT_EXPIRES_IN=1h
   REFRESH_TOKEN_SECRET=test-refresh-token-secret-key
   REFRESH_TOKEN_EXPIRES_IN=7d

   NODE_ENV=test
   PORT=3000
   ```

4. **Run database migrations on the test database**

   ```bash
   DB_NAME=myapp_e2e npm run migration:run
   ```

5. **Dependencies are installed**
   ```bash
   npm install
   ```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- users.e2e-spec.ts
npm run test:e2e -- exercises.e2e-spec.ts
npm run test:e2e -- workout-plans.e2e-spec.ts
npm run test:e2e -- workout-sessions.e2e-spec.ts
npm run test:e2e -- exercise-sets.e2e-spec.ts
```

### Run Tests in Watch Mode

```bash
npm run test:e2e -- --watch
```

### Run Tests with Coverage

```bash
npm run test:cov
```

## Test Patterns

### Database Cleanup

Each test file uses `beforeEach` to clean the database, ensuring test isolation:

```typescript
beforeEach(async () => {
  await cleanupDatabase(app);
});
```

### Test User Registration

Most tests require an authenticated user. Use the helper function:

```typescript
const { userId, accessToken, email } = await registerTestUser(
  app,
  'test@example.com',
  'password123',
);
```

### Creating Test Data

Helper functions are available for common setup operations:

```typescript
// Create exercises
const exerciseIds = await createTestExercises(app);

// Create a workout plan
const { planId } = await createTestWorkoutPlan(app, accessToken, exerciseIds);

// Create a workout session
const { sessionId } = await createTestWorkoutSession(app, accessToken, planId);
```

## Validation Testing

The test suite includes comprehensive validation tests for:

### Authentication

- Email format validation
- Password length requirements (min 8 characters)
- Duplicate email prevention
- Invalid credentials handling

### Workout Plans

- Plan name length (max 100 characters)
- Notes length (max 500 characters)
- Working sets range (0-4)
- RPE values (1-10)
- Target reps (>=1)
- Rest time (>=0)

### Exercise Sets

- Set index (>=1)
- Reps (>=1)
- Load (>=0)
- Valid set types (warmup/working)

### Authorization

- JWT token requirement
- Token validation
- User isolation (users can only access their own data)
- Plan/session ownership verification

## Mock Data

The `mock-data.ts` file provides:

- **Valid test data** - Meets all validation requirements
- **Invalid test data** - For testing validation error handling
- **Test users** - Pre-defined user credentials
- **Exercise names** - Common exercise names for testing
- **Pagination parameters** - For testing list endpoints

Example usage:

```typescript
import {
  testUsers,
  validPlanExercise,
  invalidPlanExercise_RPE,
} from './mock-data';

// Use valid data
await request(app.getHttpServer())
  .post('/plans')
  .send({
    plan_name: 'Test Plan',
    exercises: [{ ...validPlanExercise, exercise_id: exerciseId }],
  });

// Test validation with invalid data
await request(app.getHttpServer())
  .post('/plans')
  .send({
    plan_name: 'Test Plan',
    exercises: [{ ...invalidPlanExercise_RPE, exercise_id: exerciseId }],
  })
  .expect(400);
```

## Test Scenarios

### Happy Path Tests

- Successful CRUD operations
- Valid data flow through the system
- Multi-step workflows (e.g., register → login → create plan → start session)

### Error Handling Tests

- Missing required fields
- Invalid data formats
- Out-of-range values
- Non-existent resource IDs
- Authorization failures

### Edge Cases

- Empty lists
- Minimum/maximum boundary values
- Zero values where allowed
- Decimal precision for load values
- Concurrent operations

### Business Logic Tests

- User isolation (data segregation)
- Status transitions (session in_progress → completed)
- Chronological ordering
- Pagination correctness
- Search functionality

## Best Practices

1. **Test Isolation** - Each test is independent and doesn't rely on others
2. **Database Cleanup** - Database is cleaned before each test
3. **Descriptive Names** - Test names clearly describe what is being tested
4. **Arrange-Act-Assert** - Tests follow AAA pattern
5. **Error Validation** - Both success and failure cases are tested
6. **Status Code Checking** - HTTP status codes are explicitly verified
7. **Response Structure Validation** - Response bodies are validated for expected properties

## Troubleshooting

### Database Connection Issues

If tests fail with database connection errors:

1. Verify PostgreSQL is running
2. Check `.env.test` configuration (not `.env`)
3. Ensure test database exists:
   ```bash
   psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='myapp_e2e'"
   ```
4. Ensure migrations are run on test database:
   ```bash
   DB_NAME=myapp_e2e npm run migration:run
   ```

### Safety Error: "Refusing to run E2E tests on database"

If you see an error like:

```
❌ DANGER: Attempting to run E2E tests on database: myapp_dev
❌ E2E tests will DELETE ALL DATA from the database!
```

This is a safety mechanism to prevent accidentally running tests on your development or production database.

**Solution:**

1. Create a `.env.test` file with `DB_NAME=myapp_e2e`
2. Ensure the database name contains "e2e" or is specifically configured for testing
3. Never run E2E tests against databases named: `myapp_dev`, `myapp`, `myapp_prod`, or `myapp_production`

### Test Timeouts

If tests timeout:

1. Increase Jest timeout in `jest-e2e.json`
2. Check for database query performance issues
3. Ensure database has proper indexes

### Flaky Tests

If tests fail intermittently:

1. Check for race conditions
2. Verify proper use of `await` for async operations
3. Ensure database cleanup is working correctly

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure:

1. Database is available in CI environment
2. Environment variables are properly configured
3. Database is cleaned between test runs
4. Sufficient time is allocated for test execution

## Future Enhancements

Potential improvements to the test suite:

- [ ] Load testing for high-traffic scenarios
- [ ] Integration tests with OAuth providers (mocked)
- [ ] Performance benchmarking
- [ ] Concurrency testing for simultaneous sessions
- [ ] Historical data analysis endpoint testing
- [ ] Export/import functionality testing

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Add utility functions to `test-utils.ts` if reusable
3. Add mock data to `mock-data.ts` if needed
4. Update this README with new test coverage
5. Ensure all tests pass before committing
6. Include both success and failure scenarios

## Resources

- [API Plan](../../../ai/api-plan.md) - Full API specification
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing) - Official NestJS testing guide
- [Supertest Documentation](https://github.com/visionmedia/supertest) - HTTP assertion library
- [Jest Documentation](https://jestjs.io/) - Testing framework
