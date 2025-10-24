# Database Implementation Plan - TypeORM Migration Approach

## Overview

We're implementing **Option 1: TypeORM Migrations** for database management. This is the production-ready approach that gives us:

1. ✅ **Version control for database schema** - track changes over time
2. ✅ **Type-safe database operations** - TypeScript entities prevent runtime errors
3. ✅ **Automatic query generation** - TypeORM handles SQL for us
4. ✅ **Easy rollback capability** - revert database changes if needed
5. ✅ **Team collaboration** - everyone runs same migrations in order

## Why NOT Other Options?

- ❌ **Option 2 (Direct SQL)** - No version control, manual SQL, hard to rollback
- ❌ **Option 3 (Synchronize)** - Dangerous in production, can lose data, no migration history

## Implementation Steps

### Phase 1: Project Structure Setup

Create organized folder structure for database-related code:

```
backend/src/
├── config/
│   └── typeorm.config.ts          # TypeORM configuration
├── database/
│   ├── entities/                   # TypeORM entity classes
│   ├── migrations/                 # Database migration files
│   └── data-source.ts             # TypeORM DataSource for CLI
```

### Phase 2: Entity Creation

Convert SQL schema to TypeORM entities (8 tables):

1. **users.entity.ts** - User accounts with authentication
2. **user-oauth-provider.entity.ts** - OAuth login providers
3. **exercise.entity.ts** - Static exercise definitions
4. **workout-plan.entity.ts** - User's workout plans
5. **plan-exercise.entity.ts** - Exercises within plans
6. **workout-session.entity.ts** - Actual workout sessions
7. **session-exercise.entity.ts** - Exercises performed in sessions
8. **exercise-set.entity.ts** - Individual sets with reps/load

### Phase 3: Configuration Setup

1. **Environment variables** (.env file) - Database connection settings
2. **TypeORM config** - Connect NestJS to PostgreSQL
3. **DataSource config** - Enable TypeORM CLI commands
4. **Package.json scripts** - Add migration commands

### Phase 4: Initial Migration

Create migration from existing schema.sql that:

- Creates all tables with proper types
- Sets up ENUM types
- Creates indexes for performance
- Enables Row-Level Security (RLS) policies

### Phase 5: Testing & Validation

Verify everything works before using in application code.

## Files to Create/Modify

### New Files (16 files)

**Configuration:**

1. `backend/.env` - Environment variables
2. `backend/src/config/typeorm.config.ts` - TypeORM settings
3. `backend/src/database/data-source.ts` - CLI data source

**Entities (8 files):** 4. `backend/src/database/entities/user.entity.ts` 5. `backend/src/database/entities/user-oauth-provider.entity.ts` 6. `backend/src/database/entities/exercise.entity.ts` 7. `backend/src/database/entities/workout-plan.entity.ts` 8. `backend/src/database/entities/plan-exercise.entity.ts` 9. `backend/src/database/entities/workout-session.entity.ts` 10. `backend/src/database/entities/session-exercise.entity.ts` 11. `backend/src/database/entities/exercise-set.entity.ts`

**Barrel Export:** 12. `backend/src/database/entities/index.ts` - Export all entities

**Migration:** 13. `backend/src/database/migrations/[timestamp]-InitialSchema.ts`

**Documentation:** 14. `backend/src/database/README.md` - How to use migrations 15. `backend/README.md` - Update with DB setup instructions

### Modified Files (3 files)

16. `backend/src/app.module.ts` - Uncomment and configure TypeORM
17. `backend/package.json` - Add migration scripts
18. `backend/tsconfig.json` - Add paths for better imports

## Why This Approach?

### TypeORM Entities Explanation

**What are entities?**
TypeScript classes decorated with `@Entity()` that represent database tables. Each property becomes a column.

**Example:**

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;
}
```

This generates:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE
);
```

**Benefits:**

- ✅ Type safety: `user.email` is always a string
- ✅ Auto-completion in IDE
- ✅ Catch errors before runtime
- ✅ Easy to query: `userRepository.find()`

### Migration System Explanation

**What are migrations?**
Version-controlled database change scripts that run in order.

**Example workflow:**

```bash
# 1. Create migration
npm run migration:create AddUserTable

# 2. Write migration code
# 3. Run migration
npm run migration:run

# 4. If something wrong, rollback
npm run migration:revert
```

**Benefits:**

- ✅ Every team member has same database state
- ✅ Production deployments are predictable
- ✅ Easy to rollback bad changes
- ✅ Database history is documented

### Configuration Approach

**Why separate files?**

- `typeorm.config.ts` - Used by NestJS app at runtime
- `data-source.ts` - Used by TypeORM CLI for migrations
- `.env` - Keeps secrets out of code

**Why environment variables?**
Different settings for development vs production:

- Development: localhost, logging on
- Production: AWS RDS, logging off, SSL enabled

## Key Decisions

### 1. Entity Relationships

We'll use TypeORM decorators to define relationships:

- `@ManyToOne` - Many exercises → one workout plan
- `@OneToMany` - One user → many workout plans
- `@JoinColumn` - Specify foreign key column

### 2. Enum Handling

Your schema has 3 ENUM types:

- `intensity_technique`
- `set_type`
- `session_status`

We'll create TypeScript enums that TypeORM maps to PostgreSQL ENUMs.

### 3. UUID Strategy

Using `@PrimaryGeneratedColumn('uuid')` with `uuid-ossp` extension (already in schema).

### 4. Timestamps

Using TypeORM decorators:

- `@CreateDateColumn()` - Auto-sets on creation
- `@UpdateDateColumn()` - Auto-updates on modification

### 5. Row-Level Security (RLS)

Your schema has RLS policies. TypeORM doesn't handle this directly, so:

- Initial migration will create RLS policies via raw SQL
- App will set `current_setting('app.user_id')` in connection pool

### 6. Indexes

Will be defined in entities using `@Index()` decorator, but custom indexes (like trigram) will stay in migration.

## Expected Outcome

After implementation:

1. ✅ Database structure matches schema.sql exactly
2. ✅ Type-safe database operations throughout application
3. ✅ Migration system ready for future schema changes
4. ✅ Team can easily reset/setup local database
5. ✅ Production-ready database deployment strategy

## Next Steps After Plan Approval

1. Create all entity files with proper TypeORM decorators
2. Set up configuration files
3. Create initial migration
4. Add npm scripts
5. Test migration run/revert
6. Update documentation

## Commands After Implementation

```bash
# Setup database first time
npm run migration:run

# Reset database (drop all + recreate)
npm run db:reset

# Create new migration (for future changes)
npm run migration:create NameOfChange

# Rollback last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Estimated Complexity

- **Lines of code:** ~1,500 (mostly entity definitions)
- **Files created:** 16
- **Files modified:** 3
- **Time to implement:** 1-2 hours
- **Time to review/understand:** 30 minutes

## Questions to Consider

1. Do you want soft deletes (mark as deleted vs actually delete)?
2. Should we add seed data for exercises table?
3. Do you want audit logging (who changed what when)?
4. Should we add database connection pooling settings?

Let me know if you approve this plan, and I'll proceed with implementation!
