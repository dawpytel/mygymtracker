# Test Suite Quick Start Guide

Quick reference for running and working with the E2E test suite.

## Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e-spec.ts

# Run tests matching a pattern
npm run test:e2e -- --testNamePattern="should create"

# Run with verbose output
npm run test:e2e -- --verbose

# Run and watch for changes
npm run test:e2e -- --watch

# Run with coverage report
npm run test:cov
```

## Test Files Overview

| File | Endpoints Tested | Test Count |
|------|-----------------|------------|
| `auth.e2e-spec.ts` | POST /auth/register, /auth/login, /auth/logout | 20+ |
| `users.e2e-spec.ts` | GET /users/me | 8+ |
| `exercises.e2e-spec.ts` | GET /exercises, GET /exercises/:id | 25+ |
| `workout-plans.e2e-spec.ts` | CRUD /plans | 45+ |
| `workout-sessions.e2e-spec.ts` | CRUD /sessions + exercises | 50+ |
| `exercise-sets.e2e-spec.ts` | POST/PATCH sets | 35+ |

**Total: 180+ comprehensive E2E tests**

## Common Test Scenarios

### 1. Test Authentication Flow

```bash
npm run test:e2e -- auth.e2e-spec.ts
```

Tests:
- User registration
- Login with email/password
- OAuth authentication
- Logout
- Invalid credentials
- Token validation

### 2. Test User Data Access

```bash
npm run test:e2e -- users.e2e-spec.ts
```

Tests:
- Retrieving user profile
- Authentication requirements
- Last login tracking
- Data isolation between users

### 3. Test Exercise Catalog

```bash
npm run test:e2e -- exercises.e2e-spec.ts
```

Tests:
- Listing exercises
- Search/autocomplete
- Pagination
- Exercise details retrieval

### 4. Test Workout Plan Management

```bash
npm run test:e2e -- workout-plans.e2e-spec.ts
```

Tests:
- Creating plans with exercises
- Updating plans
- Deleting plans
- Plan validation
- User ownership verification

### 5. Test Workout Session Logging

```bash
npm run test:e2e -- workout-sessions.e2e-spec.ts
npm run test:e2e -- exercise-sets.e2e-spec.ts
```

Tests:
- Starting workout sessions
- Logging sets (warmup/working)
- Updating session status
- Exercise history tracking
- Set corrections

## Running Tests by Category

### Validation Tests

Test all validation rules:

```bash
npm run test:e2e -- --testNamePattern="should reject"
```

### Authorization Tests

Test authentication and ownership:

```bash
npm run test:e2e -- --testNamePattern="401|403|authorization|another user"
```

### Success Path Tests

Test successful operations:

```bash
npm run test:e2e -- --testNamePattern="should create|should update|should return"
```

### Pagination Tests

Test list endpoints with pagination:

```bash
npm run test:e2e -- --testNamePattern="pagination|limit|offset"
```

## Database Management

### Clean Database Before Tests

The test suite automatically cleans the database before each test. No manual cleanup needed.

### Seed Database for Manual Testing

```bash
npm run db:seed-dev
```

### Run Migrations

```bash
npm run migration:run
```

## Debugging Failed Tests

### 1. Run Single Test with Verbose Output

```bash
npm run test:e2e -- auth.e2e-spec.ts --verbose
```

### 2. Add Console Logs in Tests

```typescript
it('should do something', async () => {
  const response = await request(app.getHttpServer())
    .post('/endpoint')
    .send(data);
  
  console.log('Response:', response.body); // Debug output
  expect(response.status).toBe(201);
});
```

### 3. Check Database State

Add this to your test:

```typescript
const dataSource = app.get(DataSource);
const users = await dataSource.query('SELECT * FROM users');
console.log('Users in DB:', users);
```

### 4. Isolate the Test

Use `.only` to run just one test:

```typescript
it.only('should create user', async () => {
  // This test will run in isolation
});
```

## Test Data Reference

### Valid Test Users

```typescript
// From mock-data.ts
testUsers.user1.email     // 'user1@test.com'
testUsers.user1.password  // 'password123'
testUsers.user2.email     // 'user2@test.com'
testUsers.user2.password  // 'password456'
```

### Valid Plan Exercise

```typescript
// From mock-data.ts
{
  exercise_id: '<uuid>',
  display_order: 0,
  intensity_technique: 'drop_set',
  warmup_sets: 2,
  working_sets: 3,
  target_reps: 10,
  rpe_early: 7,
  rpe_last: 9,
  rest_time: 120,
  notes: 'Focus on form'
}
```

### Valid Exercise Set

```typescript
// From mock-data.ts
{
  set_type: 'working',
  set_index: 1,
  reps: 10,
  load: 80.5
}
```

## Environment Setup

### 1. Database Configuration

Ensure `.env` file has:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mygymtracker
```

### 2. Test Database (Optional)

For isolated test database:

```env
DB_DATABASE=mygymtracker_test
```

Then create the database:

```bash
psql -U postgres -c "CREATE DATABASE mygymtracker_test;"
npm run migration:run
```

## Coverage Report

Generate and view coverage:

```bash
# Generate coverage
npm run test:cov

# Open coverage report (macOS)
open coverage/lcov-report/index.html

# Open coverage report (Linux)
xdg-open coverage/lcov-report/index.html

# Open coverage report (Windows)
start coverage/lcov-report/index.html
```

## Common Issues

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS with Homebrew:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Docker:
docker-compose up -d
```

### Issue: "Migration not found"

**Solution:**
```bash
# Run migrations
npm run migration:run

# Check migration status
npm run migration:show
```

### Issue: "Test timeout"

**Solution:**
1. Increase timeout in `jest-e2e.json`:
   ```json
   {
     "testTimeout": 30000
   }
   ```

2. Or in specific test:
   ```typescript
   it('slow test', async () => {
     // test code
   }, 30000); // 30 second timeout
   ```

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## Performance Tips

1. **Run tests in parallel** (default behavior)
2. **Use test database** separate from development
3. **Ensure indexes exist** for frequently queried fields
4. **Monitor test execution time** and optimize slow tests
5. **Use transactions** for faster database cleanup (future enhancement)

## Next Steps

After running tests:

1. Review coverage report for gaps
2. Add tests for new features
3. Update mock data as validation rules change
4. Keep test documentation current

## Support

- Check [README.md](./README.md) for detailed documentation
- Review [API Plan](../../../ai/api-plan.md) for endpoint specifications
- See test files for example usage patterns

