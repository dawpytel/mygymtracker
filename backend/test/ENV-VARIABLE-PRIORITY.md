# Environment Variable Priority in E2E Tests

This document explains how environment variables are loaded and which ones take precedence in different scenarios.

## Overview

The E2E test setup uses multiple sources for environment variables:

1. **GitHub Actions environment variables** (CI/CD)
2. **`.env.test` file** (local development)
3. **`.env` file** (fallback)
4. **Hardcoded defaults** in `data-source.ts`

## Loading Order & Priority

### Order of Execution:

```
1. GitHub Actions sets env vars (if running in CI)
   ↓
2. data-source.ts loads → dotenv.config() from .env (no override)
   ↓
3. global-setup.ts loads → dotenv.config({ path: '.env.test', override: false })
   ↓
4. Tests run with final environment
```

### Priority (Highest to Lowest):

1. **System environment variables** (GitHub Actions, shell exports)
2. **`.env.test`** (only for variables NOT already set)
3. **`.env`** (only for variables NOT already set)
4. **Hardcoded defaults** in code

## Key Configuration: `override: false`

```typescript
// backend/test/global-setup.ts
dotenv.config({ path: envTestPath, override: false });
```

**What this means:**

- If `DB_NAME` is already set (e.g., by GitHub Actions) → **Use GitHub Actions value**
- If `DB_NAME` is NOT set → **Use value from `.env.test`**

**Why this is important:**

- GitHub Actions can set its own database configuration
- Local development uses `.env.test` automatically
- No conflicts between environments

## Scenarios

### Scenario 1: Running Locally

```bash
cd backend
npm run test:e2e
```

**Environment variable resolution:**

```
DB_NAME not set in system
  → Check .env.test → Found: DB_NAME=myapp_db
  → Use: myapp_db
```

### Scenario 2: Running in GitHub Actions

```yaml
env:
  DB_NAME: myapp_db
  DB_HOST: localhost
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

**Environment variable resolution:**

```
DB_NAME already set by GitHub Actions: myapp_db
  → Skip .env.test (override: false)
  → Use: myapp_db (from GitHub Actions)

JWT_SECRET already set by GitHub Actions: <actual-secret>
  → Skip .env.test (override: false)
  → Use: <actual-secret> (from GitHub Actions)

GOOGLE_CLIENT_ID not set by GitHub Actions
  → Check .env.test → Found: GOOGLE_CLIENT_ID=test-google-client-id
  → Use: test-google-client-id
```

### Scenario 3: Running with Custom Environment

```bash
export DB_NAME=myapp_custom
npm run test:e2e
```

**Environment variable resolution:**

```
DB_NAME already set in shell: myapp_custom
  → Skip .env.test (override: false)
  → Use: myapp_custom
```

## Configuration Files

### `.env.test` (Local Development)

```env
# Used when running E2E tests locally
# Will NOT override GitHub Actions variables
DB_NAME=myapp_db
DB_HOST=localhost
JWT_SECRET=test-jwt-secret-key-for-e2e-tests-only
```

**Purpose:**

- Provides defaults for local E2E testing
- Committed to repository for consistency
- Safe test values (not production secrets)

### GitHub Actions Workflow

```yaml
- name: Run E2E tests with coverage
  working-directory: ./backend
  env:
    DB_NAME: myapp_db # Takes precedence
    JWT_SECRET: ${{ secrets.JWT_SECRET }} # Production-like secret
    GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  run: npm run test:e2e
```

**Purpose:**

- Provides CI-specific configuration
- Uses GitHub Secrets for sensitive values
- Can differ from local `.env.test`

## Verification

You can verify which environment variables are being used by checking the test output:

```
🧹 Setting up test environment...

📁 Loaded test configuration from: /path/to/.env.test
🗄️  Test database: myapp_db
🔧 Database host: localhost
🌍 Environment: test
```

Or in CI:

```
🧹 Setting up test environment...

📁 Using environment variables (CI mode or .env.test not found)
🗄️  Test database: myapp_db
🔧 Database host: localhost
🌍 Environment: test
```

## Best Practices

### 1. Always Use `override: false` in Tests

```typescript
// ✅ GOOD - GitHub Actions values take precedence
dotenv.config({ path: '.env.test', override: false });

// ❌ BAD - Would override GitHub Actions values
dotenv.config({ path: '.env.test', override: true });
```

### 2. Keep `.env.test` Simple

Only include variables needed for local testing:

- Database connection details
- Test JWT secrets (not real secrets)
- Required environment flags

### 3. Use GitHub Secrets for Sensitive Values

```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }} # ✅ From GitHub Secrets
  # Not hardcoded in workflow file
```

### 4. Document Environment-Specific Differences

| Variable     | Local (.env.test)    | GitHub Actions | Production   |
| ------------ | -------------------- | -------------- | ------------ |
| `DB_NAME`    | `myapp_db`           | `myapp_db`     | `myapp_prod` |
| `JWT_SECRET` | `test-jwt-secret...` | From Secrets   | From Secrets |
| `NODE_ENV`   | `test`               | `test`         | `production` |
| `DB_HOST`    | `localhost`          | `localhost`    | `<RDS_HOST>` |

## Troubleshooting

### Issue: Tests using wrong database in CI

**Symptom:**

```
Error: database "myapp_dev" does not exist
```

**Cause:** GitHub Actions environment variables not set correctly.

**Solution:** Check workflow file:

```yaml
env:
  DB_NAME: myapp_db # ← Make sure this is set
```

### Issue: Tests using wrong database locally

**Symptom:**

```
Error: database "myapp_e2e" does not exist
```

**Cause:** `.env.test` has wrong database name.

**Solution:** Update `.env.test`:

```env
DB_NAME=myapp_db  # ← Should match what you created
```

### Issue: Can't override for testing

**Symptom:** Need to temporarily use different database.

**Solution:** Use shell export (takes highest precedence):

```bash
export DB_NAME=myapp_custom
npm run test:e2e
```

## Summary

**The key principle:**

- **GitHub Actions environment variables ALWAYS win** (highest priority)
- **`.env.test` provides local defaults** (fallback for unset variables)
- **No conflicts** between CI and local development

This design ensures:

- ✅ CI/CD can use its own configuration
- ✅ Local development works out of the box
- ✅ Developers can override when needed
- ✅ No accidental use of wrong database
