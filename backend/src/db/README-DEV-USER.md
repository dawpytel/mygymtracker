# Development User Setup

This document explains how to set up and use the default development user for testing the API before authentication is fully implemented.

## Overview

Since authentication is not yet implemented, we use a **development-only authentication guard** (`DevAuthGuard`) that automatically injects a default user into all requests. This allows you to test the API endpoints without needing JWT tokens.

## Default Development User

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| **User ID**  | `00000000-0000-0000-0000-000000000001`         |
| **Email**    | `dev@example.com`                              |
| **Password** | `password123` (for future auth implementation) |

## Setup Instructions

### 1. Ensure Database is Running

Make sure your PostgreSQL database is running:

```bash
# If using Docker Compose (from project root)
docker-compose up -d postgres

# Or check if PostgreSQL is running locally
psql -U postgres -c "SELECT version();"
```

### 2. Run Database Migrations

Apply all database migrations to create the schema:

```bash
cd backend
npm run migration:run
```

### 3. Seed the Development User

Run the seed script to create the default user and sample data:

```bash
npm run db:seed-dev
```

**Or manually via psql:**

```bash
psql -U postgres -d myapp_dev -f src/db/seed-dev-user.sql
```

### 4. Verify User Creation

Connect to the database and verify the user exists:

```bash
psql -U postgres -d myapp_dev
```

```sql
SELECT id, email, created_at FROM users WHERE email = 'dev@example.com';
SELECT COUNT(*) as plan_count FROM workout_plans WHERE user_id = '00000000-0000-0000-0000-000000000001';
```

Expected output:

- 1 user with email `dev@example.com`
- 3 sample workout plans (Push Day, Pull Day, Leg Day)

## How It Works

### Development Auth Guard

The `DevAuthGuard` is currently used in all protected endpoints:

```typescript
@Controller('plans')
@UseGuards(DevAuthGuard) // ← Uses dev guard instead of JwtAuthGuard
export class WorkoutPlansController {
  // ...
}
```

When a request comes in, the guard automatically injects this user object:

```typescript
request.user = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
};
```

### Sample Data Created

The seed script creates:

1. **Development User**
   - ID: `00000000-0000-0000-0000-000000000001`
   - Email: `dev@example.com`

2. **Sample Exercises** (5 exercises)
   - Bench Press
   - Squat
   - Deadlift
   - Overhead Press
   - Barbell Row

3. **Sample Workout Plans** (3 plans)
   - Push Day
   - Pull Day
   - Leg Day

## Testing the API

### Start the Application

```bash
npm run start:dev
```

### Test the GET /plans Endpoint

**Without any authentication token:**

```bash
curl http://localhost:3000/api/plans
```

Expected response:

```json
{
  "items": [
    {
      "id": "20000000-0000-0000-0000-000000000003",
      "plan_name": "Leg Day",
      "created_at": "2025-10-17T..."
    },
    {
      "id": "20000000-0000-0000-0000-000000000002",
      "plan_name": "Pull Day",
      "created_at": "2025-10-16T..."
    },
    {
      "id": "20000000-0000-0000-0000-000000000001",
      "plan_name": "Push Day",
      "created_at": "2025-10-15T..."
    }
  ],
  "total": 3
}
```

**Test with pagination:**

```bash
curl "http://localhost:3000/api/plans?limit=2&offset=0"
```

### Using Swagger UI

1. Navigate to: http://localhost:3000/api/docs
2. Find the "Workout Plans" section
3. Click on `GET /plans`
4. Click "Try it out"
5. Enter pagination parameters (optional)
6. Click "Execute"

**Note:** No authentication token is required in development mode!

## Switching to Production Authentication

When authentication is ready, follow these steps:

### 1. Update Controllers

Replace `DevAuthGuard` with `JwtAuthGuard`:

```typescript
// BEFORE (Development)
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
@UseGuards(DevAuthGuard)

// AFTER (Production)
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
```

### 2. Remove Development Guard

Delete or rename the `DevAuthGuard` file to prevent accidental use in production:

```bash
# Remove the dev guard
rm src/auth/guards/dev-auth.guard.ts

# Or rename it for future reference
mv src/auth/guards/dev-auth.guard.ts src/auth/guards/dev-auth.guard.ts.backup
```

### 3. Environment Check

Consider adding an environment check to prevent dev guards in production:

```typescript
if (process.env.NODE_ENV === 'production' && useDevGuard) {
  throw new Error('DevAuthGuard cannot be used in production!');
}
```

## Troubleshooting

### Issue: User Already Exists

If you see an error about duplicate user:

```bash
# The seed script uses ON CONFLICT DO NOTHING, so it's safe to run multiple times
# The existing user will be preserved
```

### Issue: Cannot Connect to Database

```bash
# Check database connection
psql -U postgres -c "SELECT 1"

# Check environment variables
cat .env | grep DB_
```

### Issue: No Plans Returned

```bash
# Verify user exists
psql -U postgres -d myapp_dev -c "SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';"

# Verify plans exist
psql -U postgres -d myapp_dev -c "SELECT * FROM workout_plans WHERE user_id = '00000000-0000-0000-0000-000000000001';"

# If no plans, re-run seed script
npm run db:seed-dev
```

### Issue: RLS (Row Level Security) Blocking Queries

The database has RLS policies enabled. If queries fail:

```sql
-- Temporarily disable RLS for testing (development only!)
ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;

-- Or set the session variable (proper way)
SET app.user_id = '00000000-0000-0000-0000-000000000001';
```

**Note:** The application-level filtering (WHERE clause) should work without needing to set RLS variables.

## Important Security Notes

⚠️ **WARNING: DEVELOPMENT ONLY**

1. **Never use DevAuthGuard in production**
2. **Never deploy the seed file to production**
3. **Always use proper JWT authentication in production**
4. **The dev user has a well-known ID and should be removed before production**

## Next Steps

Once authentication is implemented:

1. ✅ Create user registration endpoint
2. ✅ Create login endpoint
3. ✅ Implement JWT token generation
4. ✅ Replace `DevAuthGuard` with `JwtAuthGuard`
5. ✅ Remove or secure the development user
6. ✅ Add proper authorization checks
7. ✅ Test with real JWT tokens

---

**Last Updated:** October 2025
