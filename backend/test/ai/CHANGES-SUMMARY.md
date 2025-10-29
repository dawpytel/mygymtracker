# E2E Database Setup - Changes Summary

## Problem Solved

**Original Issue:** E2E tests in GitHub Actions were failing with:

```
error: database "myapp_e2e" does not exist
```

**Root Causes:**

1. `.env.test` was overriding GitHub Actions environment variables (`override: true`)
2. Database `myapp_db` was not created before running tests
3. Mismatch between local and CI database configurations

## Changes Made

### 1. Fixed Environment Variable Priority

**File:** `backend/test/global-setup.ts`

**Before:**

```typescript
dotenv.config({ path: envTestPath, override: true });
```

**After:**

```typescript
dotenv.config({ path: envTestPath, override: false });
```

**Why:** This ensures GitHub Actions environment variables take precedence over `.env.test`.

### 2. Created `.env.test` File

**File:** `backend/.env.test` (NEW)

```env
DB_NAME=myapp_db
DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=postgres
...
```

**Purpose:** Provides default configuration for local E2E testing.

### 3. Updated GitHub Actions Workflow

**File:** `.github/workflows/pull-request.yml`

**Changes:**

- Added step to create `myapp_db` database before migrations
- Updated all E2E-related env vars to use `myapp_db`
- Changed `NODE_ENV` from `development` to `test`

```yaml
- name: Create E2E test database
  env:
    PGPASSWORD: postgres
  run: |
    psql -h localhost -U postgres -d postgres -c "CREATE DATABASE myapp_db;"
```

### 4. Created Database Initialization Script

**File:** `backend/scripts/init-db.sh` (NEW)

**Purpose:** Docker entrypoint script to create both `myapp_dev` and `myapp_db` databases when PostgreSQL container starts.

### 5. Added Debugging Output

**File:** `backend/test/global-setup.ts`

Added console logs to show:

- Where configuration is loaded from (CI vs .env.test)
- Database name being used
- Database host
- Node environment

## Database Separation

| Database    | Purpose     | Used By          |
| ----------- | ----------- | ---------------- |
| `myapp_dev` | Development | Local web app    |
| `myapp_db`  | E2E Testing | Local & CI tests |

**Benefits:**

- ✅ Development data never affected by tests
- ✅ Tests run in clean, isolated environment
- ✅ Can run dev server and tests simultaneously
- ✅ Same database name in local and CI

## Environment Variable Priority

```
1. GitHub Actions / System Exports  ← HIGHEST
2. .env.test (fallback)
3. .env (fallback)
4. Hardcoded defaults
```

**Key Configuration:**

```typescript
// override: false means existing env vars are NOT overwritten
dotenv.config({ path: '.env.test', override: false });
```

## How It Works Now

### Local Development

```bash
# 1. Start PostgreSQL (creates both databases)
docker-compose up -d postgres

# 2. Run E2E tests
cd backend
npm run test:e2e
```

**Behavior:**

- Loads config from `.env.test`
- Connects to `myapp_db`
- Runs migrations automatically (via global-setup)
- Tests execute against clean database

### GitHub Actions CI

```yaml
env:
  DB_NAME: myapp_db
  DB_HOST: localhost
  ...
```

**Behavior:**

- Uses GitHub Actions environment variables
- `.env.test` provides fallback for missing variables
- Database created explicitly before tests
- Same database name as local (`myapp_db`)

## Verification

After changes, test output shows:

**Local:**

```
📁 Loaded test configuration from: /path/to/.env.test
🗄️  Test database: myapp_db
🔧 Database host: localhost
🌍 Environment: test
```

**GitHub Actions:**

```
📁 Using environment variables (CI mode or .env.test not found)
🗄️  Test database: myapp_db
🔧 Database host: localhost
🌍 Environment: test
```

## Files Created/Modified

### Created:

- ✅ `backend/.env.test` - Local E2E test configuration
- ✅ `backend/scripts/init-db.sh` - Docker database initialization
- ✅ `backend/test/ENV-VARIABLE-PRIORITY.md` - Detailed documentation
- ✅ `backend/test/QUICK-REFERENCE.md` - Quick reference guide
- ✅ `backend/test/CHANGES-SUMMARY.md` - This file

### Modified:

- ✅ `backend/test/global-setup.ts` - Fixed override behavior, added logging
- ✅ `.github/workflows/pull-request.yml` - Added DB creation, fixed env vars
- ✅ `backend/scripts/init-db.sh` - Fixed database name consistency

## Testing the Changes

### Test Locally

```bash
# 1. Ensure PostgreSQL is running
docker-compose up -d postgres

# 2. Run E2E tests
cd backend
npm run test:e2e

# 3. Check output shows correct database
# Look for: "Test database: myapp_db"
```

### Test in CI

Push changes and check GitHub Actions:

1. "Create E2E test database" step should succeed
2. "Run database migrations" should succeed
3. "Run E2E tests" should pass
4. Check logs for "Test database: myapp_db"

## Troubleshooting

### Database doesn't exist locally

```bash
# Option 1: Restart Docker (runs init-db.sh)
docker-compose down -v
docker-compose up -d postgres

# Option 2: Create manually
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE myapp_db;"
```

### GitHub Actions still failing

1. Check workflow file has correct `DB_NAME: myapp_db`
2. Verify "Create E2E test database" step is present
3. Check step order: Create DB → Run Migrations → Run Tests

### Wrong database in tests

```bash
# Check what's in .env.test
cat backend/.env.test | grep DB_NAME

# Override temporarily
export DB_NAME=myapp_db
npm run test:e2e
```

## Next Steps

1. ✅ Commit changes to version control
2. ✅ Push and verify GitHub Actions passes
3. ✅ Update team documentation if needed
4. ✅ Consider adding database setup to project README

## Related Documentation

- `ENV-VARIABLE-PRIORITY.md` - Detailed explanation of env var loading
- `QUICK-REFERENCE.md` - Quick visual reference
- `.github/workflows/pull-request.yml` - CI/CD configuration
