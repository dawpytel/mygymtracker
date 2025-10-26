# Database Migrations

This directory contains TypeORM migrations for the MyGymTracker application.

## Overview

The database schema includes:

- **Users** with OAuth provider support
- **Exercises** (static exercise library)
- **Workout Plans** with exercises, sets, RPE, and intensity techniques
- **Workout Sessions** with exercise logs and set tracking
- **Row-Level Security (RLS)** policies for data isolation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myapp_dev
NODE_ENV=development
```

### 3. Start PostgreSQL

Using Docker Compose (from project root):

```bash
docker-compose up -d postgres
```

### 4. Create Database

You need to create the `myapp_dev` database before running migrations. Choose one of these methods:

**Option A: Using Docker Compose exec** (Recommended)
```bash
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE myapp_dev;"
```

**Option B: Using docker exec with container name**
```bash
docker exec -it myapp-postgres psql -U postgres -c "CREATE DATABASE myapp_dev;"
```

**Option C: Using psql directly**
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE myapp_dev;"
```

**Option D: Using pgAdmin**
1. Open pgAdmin at http://localhost:5050
2. Login with email: `admin@admin.com`, password: `admin`
3. Add server: host `postgres`, port `5432`, user `postgres`, password `postgres`
4. Right-click "Databases" → Create → Database
5. Name: `myapp_dev`

## Migration Commands

### Run Migrations

Execute all pending migrations:

```bash
npm run migration:run
```

### Revert Last Migration

Rollback the most recently executed migration:

```bash
npm run migration:revert
```

### Show Migration Status

Display which migrations have been run:

```bash
npm run migration:show
```

### Generate New Migration

Generate a migration based on entity changes:

```bash
npm run migration:generate -- src/db/migrations/MigrationName
```

### Create Empty Migration

Create a new empty migration file:

```bash
npm run migration:create -- src/db/migrations/MigrationName
```

## Database Schema

### ENUM Types

- `intensity_technique`: drop_set, pause, partial_length, fail, superset, N/A
- `set_type`: warmup, working
- `session_status`: in_progress, completed, cancelled

### Tables

1. **users** - User accounts with email/password
2. **user_oauth_providers** - OAuth authentication providers
3. **exercises** - Static exercise library
4. **workout_plans** - User workout plans
5. **plan_exercises** - Exercises within a workout plan
6. **workout_sessions** - Individual workout sessions
7. **session_exercises** - Exercises performed in a session
8. **exercise_sets** - Individual sets with reps and load

### Security

Row-Level Security (RLS) policies ensure users can only access their own data:

- Workout plans are scoped to `user_id`
- Sessions are scoped to `user_id`
- Related records (plan exercises, session exercises, sets) inherit access control

### Indexes

- `idx_workout_sessions_user_completed` - Optimized for user workout history queries
- `idx_workout_sessions_plan` - Optimized for plan-based queries
- `idx_exercises_name_trgm` - Full-text search on exercise names (trigram index)

## Data Source Configuration

The TypeORM data source is configured in `data-source.ts` and used by the CLI for running migrations. The NestJS application should use the same configuration through `@nestjs/typeorm`.

## Notes

- Migrations are timestamped to ensure proper ordering
- Always test migrations in development before running in production
- The `down` method in each migration should properly revert all changes
- RLS policies are enabled on user-scoped tables for security
