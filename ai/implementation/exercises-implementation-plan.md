# API Endpoint Implementation Plan: Exercises Endpoints

## 1. Endpoint Overview

This plan covers the implementation of two read-only REST API endpoints for managing exercise data:

- **GET /exercises** - List exercises with autocomplete search and pagination
- **GET /exercises/:id** - Retrieve a single exercise by ID

These endpoints provide access to the static exercise reference data stored in the `exercises` table. The exercises are shared across all users and serve as a catalog of available exercises that can be added to workout plans and sessions.

**Key Features:**

- Autocomplete search using PostgreSQL trigram similarity
- Pagination support with configurable limit and offset
- JWT authentication required
- Read-only operations (no mutations)

## 2. Request Details

### GET /exercises

- **HTTP Method:** GET
- **URL Structure:** `/exercises`
- **Authentication:** Required (JWT Bearer token)
- **Parameters:**
  - **Query Parameters:**
    - `search` (optional): string - Search term for exercise name autocomplete
    - `limit` (optional): number - Maximum number of items to return (default: 10, range: 1-100)
    - `offset` (optional): number - Number of items to skip (default: 0, minimum: 0)
- **Request Body:** None

### GET /exercises/:id

- **HTTP Method:** GET
- **URL Structure:** `/exercises/:id`
- **Authentication:** Required (JWT Bearer token)
- **Parameters:**
  - **Path Parameters:**
    - `id` (required): UUID - Unique identifier of the exercise
  - **Query Parameters:** None
- **Request Body:** None

## 3. Used Types

All required types are already defined in `backend/src/types.ts`:

### Input DTOs

```typescript
// Query parameters for GET /exercises
export class ExerciseQueryDto {
  limit?: number; // 1-100, default 10
  offset?: number; // >= 0, default 0
  search?: string; // Optional search term
}
```

### Output DTOs

```typescript
// Single exercise response (GET /exercises/:id)
export class ExerciseDto {
  id: string; // UUID
  name: string;
}

// List response (GET /exercises)
export class ExerciseListDto {
  items: ExerciseDto[];
  total: number;
}
```

### Entity Types

```typescript
// Database entity
export interface ExerciseEntity {
  id: string; // UUID
  name: string;
}
```

## 4. Response Details

### GET /exercises

**Success Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Bench Press"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Bent-Over Row"
    }
  ],
  "total": 150
}
```

**Response Headers:**

- `Content-Type: application/json`

### GET /exercises/:id

**Success Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Bench Press"
}
```

**Response Headers:**

- `Content-Type: application/json`

## 5. Data Flow

### GET /exercises

1. **Request Reception:** Client sends GET request with optional query parameters
2. **Authentication:** JWT Auth Guard validates the Bearer token
3. **Validation:** Transform and validate query parameters using `ExerciseQueryDto` with class-validator
4. **Service Layer:** Controller calls `ExercisesService.findAll(queryParams)`
5. **Database Query:**
   - Build TypeORM query with pagination (`limit`, `offset`)
   - If `search` provided: Apply trigram similarity search on `name` field using `ILIKE` or trigram operators
   - Execute two queries: one for data, one for total count
   - Leverage `idx_exercises_name_trgm` GIN index for performance
6. **Transform:** Map `ExerciseEntity[]` to `ExerciseDto[]`
7. **Response:** Return `ExerciseListDto` with items and total count

### GET /exercises/:id

1. **Request Reception:** Client sends GET request with exercise ID in path
2. **Authentication:** JWT Auth Guard validates the Bearer token
3. **Validation:** Validate `id` parameter is a valid UUID using built-in `ParseUUIDPipe`
4. **Service Layer:** Controller calls `ExercisesService.findOne(id)`
5. **Database Query:**
   - Query `exercises` table by `id`
   - Use TypeORM `findOne()` or `findOneBy()`
6. **Error Handling:** If not found, throw `NotFoundException`
7. **Transform:** Map `ExerciseEntity` to `ExerciseDto`
8. **Response:** Return `ExerciseDto`

### Database Schema Reference

```sql
-- exercises table structure
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Trigram index for fast autocomplete
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin (name gin_trgm_ops);
```

## 6. Security Considerations

### Authentication

- **JWT Guard:** Both endpoints must use `@UseGuards(JwtAuthGuard)` decorator
- **Token Validation:** Verify JWT signature and expiration
- **User Context:** While exercises are shared data, authentication is still required to track API usage

### Authorization

- **No Row-Level Security:** The `exercises` table has no RLS policies (unlike workout_plans)
- **Read-Only Access:** All authenticated users can read all exercises
- **No Ownership:** Exercises are not user-specific, so no user_id validation needed

### Input Validation

- **UUID Validation:** Use `ParseUUIDPipe` to prevent invalid ID formats
- **Query Parameter Bounds:**
  - Limit `limit` to 1-100 range to prevent excessive data retrieval
  - Ensure `offset` is non-negative
  - Sanitize `search` parameter (handled by parameterized queries)
- **SQL Injection:** TypeORM uses parameterized queries, preventing SQL injection

### Rate Limiting

- Consider implementing rate limiting for search endpoint to prevent abuse
- Especially important for autocomplete functionality that may be called frequently

### CORS & Headers

- Ensure Helmet middleware is applied for security headers
- Configure CORS appropriately for frontend domain

## 7. Error Handling

### GET /exercises

| Error Scenario                         | Status Code | Error Response                                                                                   | Handling Strategy                                              |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Invalid query parameters (limit > 100) | 400         | `{"statusCode": 400, "message": ["limit must not be greater than 100"], "error": "Bad Request"}` | Class-validator will automatically throw `BadRequestException` |
| Invalid query parameters (offset < 0)  | 400         | `{"statusCode": 400, "message": ["offset must not be less than 0"], "error": "Bad Request"}`     | Class-validator will automatically throw `BadRequestException` |
| Missing/invalid JWT token              | 401         | `{"statusCode": 401, "message": "Unauthorized"}`                                                 | JWT Guard throws `UnauthorizedException`                       |
| Database connection failure            | 500         | `{"statusCode": 500, "message": "Internal server error"}`                                        | Catch database errors, log details, return generic message     |
| Database query timeout                 | 500         | `{"statusCode": 500, "message": "Internal server error"}`                                        | Catch timeout, log, return generic message                     |

### GET /exercises/:id

| Error Scenario              | Status Code | Error Response                                                                                   | Handling Strategy                                          |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Invalid UUID format         | 400         | `{"statusCode": 400, "message": "Validation failed (uuid is expected)", "error": "Bad Request"}` | `ParseUUIDPipe` throws `BadRequestException`               |
| Missing/invalid JWT token   | 401         | `{"statusCode": 401, "message": "Unauthorized"}`                                                 | JWT Guard throws `UnauthorizedException`                   |
| Exercise not found          | 404         | `{"statusCode": 404, "message": "Exercise not found", "error": "Not Found"}`                     | Throw `NotFoundException` if `findOne()` returns null      |
| Database connection failure | 500         | `{"statusCode": 500, "message": "Internal server error"}`                                        | Catch database errors, log details, return generic message |

### Error Handling Implementation Guidelines

1. **Early Returns:** Check for error conditions at the beginning of functions
2. **Guard Clauses:** Use guard clauses to handle preconditions
3. **Specific Exceptions:** Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`)
4. **Error Logging:** Log errors with context (user ID, request ID, timestamp) using NestJS Logger
5. **User-Friendly Messages:** Return clear, actionable error messages
6. **No Sensitive Data:** Never expose stack traces or database details in production

## 8. Performance Considerations

### Database Optimization

- **Trigram Index:** The `idx_exercises_name_trgm` GIN index enables fast fuzzy search
  - Use `ILIKE` pattern matching or similarity operators for search
  - Index lookup is O(log n) instead of O(n) for full table scan
- **Pagination:** Use `LIMIT` and `OFFSET` to prevent large result sets
- **Count Optimization:** Consider caching total count if exercises table is relatively static

### Query Optimization

```typescript
// Efficient search query structure
const [items, total] = await this.exerciseRepository.findAndCount({
  where: search ? { name: ILike(`%${search}%`) } : {},
  take: limit,
  skip: offset,
  order: { name: "ASC" },
});
```

### Caching Strategies

- **Static Data:** Exercises table is relatively static (admin-managed)
- **Consider:** Implementing Redis cache for frequently accessed exercises
- **TTL:** Long TTL (hours) appropriate for reference data
- **Cache Invalidation:** Only needed when exercises are added/modified (admin operation)

### Response Size

- **Minimal Fields:** Return only `id` and `name` (no unnecessary data)
- **Pagination:** Default limit of 10 prevents large payloads
- **Compression:** Ensure gzip/brotli compression is enabled in Nginx

### Autocomplete Performance

- **Debouncing:** Frontend should debounce search input (300-500ms)
- **Minimum Length:** Consider requiring minimum 2-3 characters before searching
- **Result Limit:** Keep default limit small (10-20 items) for autocomplete

## 9. Implementation Steps

### Step 1: Create Exercise Entity

**File:** `backend/src/exercises/entities/exercise.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("exercises")
export class Exercise {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;
}
```

**Validation:**

- Verify entity name matches database table name
- Ensure column types match schema.sql

### Step 2: Create Exercises Service

**File:** `backend/src/exercises/exercises.service.ts`

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Exercise } from "./entities/exercise.entity";
import { ExerciseQueryDto, ExerciseListDto, ExerciseDto } from "../types";

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>
  ) {}

  async findAll(query: ExerciseQueryDto): Promise<ExerciseListDto> {
    const { limit = 10, offset = 0, search } = query;

    // Handle error case: validate parameters
    if (limit < 1 || limit > 100) {
      // This should be caught by class-validator, but defensive check
      throw new BadRequestException("Limit must be between 1 and 100");
    }
    if (offset < 0) {
      throw new BadRequestException("Offset must be non-negative");
    }

    try {
      const whereClause = search ? { name: ILike(`%${search}%`) } : {};

      const [items, total] = await this.exerciseRepository.findAndCount({
        where: whereClause,
        take: limit,
        skip: offset,
        order: { name: "ASC" },
      });

      return {
        items: items.map(this.toDto),
        total,
      };
    } catch (error) {
      // Log error with context
      this.logger.error("Failed to fetch exercises", error.stack);
      throw new InternalServerErrorException("Failed to retrieve exercises");
    }
  }

  async findOne(id: string): Promise<ExerciseDto> {
    // Early return pattern for error handling
    if (!id) {
      throw new BadRequestException("Exercise ID is required");
    }

    try {
      const exercise = await this.exerciseRepository.findOneBy({ id });

      // Guard clause: check if exercise exists
      if (!exercise) {
        throw new NotFoundException(`Exercise with ID ${id} not found`);
      }

      // Happy path last
      return this.toDto(exercise);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to fetch exercise ${id}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve exercise");
    }
  }

  private toDto(exercise: Exercise): ExerciseDto {
    return {
      id: exercise.id,
      name: exercise.name,
    };
  }
}
```

**Key Points:**

- Use `ILike` for case-insensitive search (leverages trigram index)
- Implement proper error handling with early returns
- Log errors with context before throwing generic messages
- Apply guard clauses for preconditions

### Step 3: Create Exercises Controller

**File:** `backend/src/exercises/exercises.controller.ts`

```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExercisesService } from "./exercises.service";
import { ExerciseQueryDto, ExerciseListDto, ExerciseDto } from "../types";

@ApiTags("exercises")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: "List exercises with autocomplete" })
  @ApiResponse({
    status: 200,
    description: "Exercises retrieved successfully",
    type: ExerciseListDto,
  })
  @ApiResponse({ status: 400, description: "Invalid query parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Query() query: ExerciseQueryDto): Promise<ExerciseListDto> {
    return this.exercisesService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve exercise details" })
  @ApiResponse({
    status: 200,
    description: "Exercise retrieved successfully",
    type: ExerciseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid UUID format" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ExerciseDto> {
    return this.exercisesService.findOne(id);
  }
}
```

**Key Points:**

- Use `@UseGuards(JwtAuthGuard)` at controller level
- Apply `ParseUUIDPipe` to validate UUID format
- Add comprehensive Swagger documentation
- Query parameter validation handled automatically by class-validator

### Step 4: Update ExerciseQueryDto Validation

**File:** `backend/src/types.ts`

Add validation decorators to `ExerciseQueryDto`:

```typescript
import { IsOptional, IsInt, Min, Max, IsString } from "class-validator";
import { Type } from "class-transformer";

export class ExerciseQueryDto {
  @ApiProperty({
    description: "Maximum number of items to return",
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: "Number of items to skip",
    example: 0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    description: "Search query for exercise name",
    example: "bench",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
```

**Key Points:**

- Add default values (limit: 10, offset: 0)
- Use `@Type(() => Number)` to transform string query params to numbers
- Apply range validation to prevent abuse

### Step 5: Create Exercises Module

**File:** `backend/src/exercises/exercises.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExercisesController } from "./exercises.controller";
import { ExercisesService } from "./exercises.service";
import { Exercise } from "./entities/exercise.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService], // Export for use in other modules
})
export class ExercisesModule {}
```

**Key Points:**

- Import `TypeOrmModule.forFeature([Exercise])` to inject repository
- Export service for use in other modules (e.g., workout plans)

### Step 6: Register Module in App Module

**File:** `backend/src/app.module.ts`

Add `ExercisesModule` to imports:

```typescript
import { ExercisesModule } from "./exercises/exercises.module";

@Module({
  imports: [
    // ... existing imports
    ExercisesModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 7: Write Unit Tests

**File:** `backend/src/exercises/exercises.service.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";
import { Exercise } from "./entities/exercise.entity";

describe("ExercisesService", () => {
  let service: ExercisesService;
  let repository: Repository<Exercise>;

  const mockRepository = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    repository = module.get<Repository<Exercise>>(getRepositoryToken(Exercise));
  });

  describe("findAll", () => {
    it("should return paginated exercises", async () => {
      const mockExercises = [
        { id: "1", name: "Bench Press" },
        { id: "2", name: "Squat" },
      ];
      mockRepository.findAndCount.mockResolvedValue([mockExercises, 2]);

      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(result).toEqual({
        items: mockExercises,
        total: 2,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        take: 10,
        skip: 0,
        order: { name: "ASC" },
      });
    });

    it("should apply search filter", async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ limit: 10, offset: 0, search: "bench" });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ name: expect.any(Object) }),
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return exercise by id", async () => {
      const mockExercise = { id: "1", name: "Bench Press" };
      mockRepository.findOneBy.mockResolvedValue(mockExercise);

      const result = await service.findOne("1");

      expect(result).toEqual(mockExercise);
    });

    it("should throw NotFoundException if exercise not found", async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Step 8: Write E2E Tests

**File:** `backend/test/exercises.e2e-spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("ExercisesController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token (implement based on your auth setup)
    // authToken = await getAuthToken();
  });

  describe("GET /exercises", () => {
    it("should return paginated exercises", () => {
      return request(app.getHttpServer())
        .get("/exercises")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("items");
          expect(res.body).toHaveProperty("total");
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it("should filter by search term", () => {
      return request(app.getHttpServer())
        .get("/exercises?search=bench")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(
            res.body.items.every((item) =>
              item.name.toLowerCase().includes("bench")
            )
          ).toBe(true);
        });
    });

    it("should reject invalid limit", () => {
      return request(app.getHttpServer())
        .get("/exercises?limit=1000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });

    it("should reject unauthenticated requests", () => {
      return request(app.getHttpServer()).get("/exercises").expect(401);
    });
  });

  describe("GET /exercises/:id", () => {
    it("should return exercise by id", async () => {
      // First get an exercise ID
      const listRes = await request(app.getHttpServer())
        .get("/exercises")
        .set("Authorization", `Bearer ${authToken}`);

      const exerciseId = listRes.body.items[0]?.id;

      return request(app.getHttpServer())
        .get(`/exercises/${exerciseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body).toHaveProperty("name");
        });
    });

    it("should return 404 for non-existent exercise", () => {
      return request(app.getHttpServer())
        .get("/exercises/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 400 for invalid UUID", () => {
      return request(app.getHttpServer())
        .get("/exercises/invalid-uuid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Step 9: Manual Testing Checklist

1. **Authentication Testing:**

   - [ ] Request without token returns 401
   - [ ] Request with invalid token returns 401
   - [ ] Request with valid token succeeds

2. **GET /exercises Testing:**

   - [ ] Default pagination works (limit=10, offset=0)
   - [ ] Custom pagination works
   - [ ] Search returns filtered results
   - [ ] Search is case-insensitive
   - [ ] Empty search returns all exercises
   - [ ] Invalid limit (> 100) returns 400
   - [ ] Negative offset returns 400
   - [ ] Response includes correct total count

3. **GET /exercises/:id Testing:**

   - [ ] Valid UUID returns exercise
   - [ ] Invalid UUID returns 400
   - [ ] Non-existent UUID returns 404
   - [ ] Response format matches specification

4. **Performance Testing:**
   - [ ] Search response time < 100ms for 1000 exercises
   - [ ] List response time < 50ms without search
   - [ ] Check query execution plan uses trigram index

### Step 10: Update API Documentation

After implementation, verify Swagger documentation at `/api`:

- [ ] Both endpoints are documented
- [ ] Request/response schemas are accurate
- [ ] Authentication is marked as required
- [ ] Example values are helpful
- [ ] Error responses are documented

### Step 11: Database Seeding (Optional)

Create a seed file for testing:

**File:** `backend/src/db/seed-exercises.sql`

```sql
-- Seed common exercises for testing
INSERT INTO exercises (name) VALUES
  ('Barbell Bench Press'),
  ('Barbell Squat'),
  ('Deadlift'),
  ('Overhead Press'),
  ('Bent-Over Row'),
  ('Pull-Up'),
  ('Chin-Up'),
  ('Dumbbell Bench Press'),
  ('Dumbbell Row'),
  ('Leg Press')
ON CONFLICT (name) DO NOTHING;
```

Run seed: `psql -U postgres -d mygymtracker < seed-exercises.sql`

## Summary

This implementation plan provides comprehensive guidance for implementing the exercises endpoints. Key highlights:

- **Security:** JWT authentication required for all endpoints
- **Validation:** Robust input validation using class-validator and ParseUUIDPipe
- **Performance:** Leverages PostgreSQL trigram index for fast autocomplete
- **Error Handling:** Follows clean code practices with early returns and guard clauses
- **Testing:** Includes unit and E2E test examples
- **Documentation:** Swagger/OpenAPI documentation included

The implementation follows NestJS best practices, TypeScript strict typing, and the project's coding guidelines. All necessary types are already defined in `types.ts`, making implementation straightforward.
