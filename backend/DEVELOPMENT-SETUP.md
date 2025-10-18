# Development Setup - Quick Start

This guide shows you how to quickly set up the development environment with a default user.

## Quick Setup (3 Steps)

### 1. Run Migrations

```bash
cd backend
npm run migration:run
```

### 2. Create Development User

```bash
npm run db:seed-dev
```

### 3. Start the Server

```bash
npm run start:dev
```

That's it! The API is now running at http://localhost:3000/api

## Test the Endpoint

### Using curl

```bash
# Get all workout plans (no auth required in dev mode)
curl http://localhost:3000/api/plans

# With pagination
curl "http://localhost:3000/api/plans?limit=10&offset=0"
```

### Using Swagger UI

Visit: http://localhost:3000/api/docs

1. Navigate to "Workout Plans" section
2. Try the `GET /plans` endpoint
3. No authentication token needed!

## What Was Created?

### Development User

- **ID:** `00000000-0000-0000-0000-000000000001`
- **Email:** `dev@example.com`
- **Password:** `password123` (for future use)

### Sample Data

- 5 exercises (Bench Press, Squat, Deadlift, etc.)
- 3 workout plans (Push Day, Pull Day, Leg Day)

## Manual SQL Query (Alternative)

If you prefer to run SQL directly:

```sql
-- Connect to database
psql -U postgres -d mygymtracker

-- Create development user
INSERT INTO users (id, email, password_hash, created_at, account_created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@example.com',
  '$2b$10$rKJ9nLNZ5fUhq0p.vJ3zO.xqL3XqD8p5F5mH5YpqG5xZ5qF5qF5qF',
  NOW(),
  NOW()
);

-- Create sample exercises
INSERT INTO exercises (id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Bench Press'),
  ('10000000-0000-0000-0000-000000000002', 'Squat'),
  ('10000000-0000-0000-0000-000000000003', 'Deadlift');

-- Create sample workout plans
INSERT INTO workout_plans (id, user_id, plan_name, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Push Day', NOW()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pull Day', NOW()),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Leg Day', NOW());
```

## How Development Auth Works

The application uses `DevAuthGuard` which automatically injects a default user into every request:

```typescript
// No JWT token needed!
// The guard automatically sets:
request.user = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
};
```

This means you can test all protected endpoints without authentication tokens.

## Files Modified for Development Mode

| File                                            | Change                                        |
| ----------------------------------------------- | --------------------------------------------- |
| `src/auth/guards/dev-auth.guard.ts`             | **NEW** - Development auth guard              |
| `src/db/seed-dev-user.sql`                      | **NEW** - SQL seed script                     |
| `src/workout-plans/workout-plans.controller.ts` | Uses `DevAuthGuard` instead of `JwtAuthGuard` |
| `package.json`                                  | Added `db:seed-dev` script                    |

## Switching Back to JWT Authentication

When authentication is ready, make this one-line change in each controller:

```typescript
// Change this:
@UseGuards(DevAuthGuard)

// To this:
@UseGuards(JwtAuthGuard)
```

## API Endpoints Available

### GET /api/plans

Returns paginated list of workout plans for the dev user.

**Query Parameters:**

- `limit` (optional): 1-100, default 20
- `offset` (optional): ≥0, default 0

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "plan_name": "string",
      "created_at": "timestamp"
    }
  ],
  "total": number
}
```

## Troubleshooting

### "Cannot connect to database"

```bash
# Check if PostgreSQL is running
docker-compose ps

# Or restart it
docker-compose up -d postgres
```

### "User already exists"

The seed script is safe to run multiple times. It uses `ON CONFLICT DO NOTHING`.

### "No plans returned"

```bash
# Re-run the seed script
npm run db:seed-dev

# Or verify data
psql -U postgres -d mygymtracker -c "SELECT * FROM workout_plans;"
```

## Environment Variables

Make sure your `.env` file contains:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=mygymtracker

# Node
NODE_ENV=development
PORT=3000

# JWT (for future use)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Additional Documentation

- **Detailed Setup:** See `src/db/README-DEV-USER.md`
- **Implementation Plan:** See `ai/view-plans-implementation-plan.md`
- **API Documentation:** Visit http://localhost:3000/api/docs when server is running

---

**Ready to develop!** 🚀
