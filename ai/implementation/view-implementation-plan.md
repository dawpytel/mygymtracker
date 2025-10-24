# API Endpoint Implementation Plan: Workout Session Endpoints

## 1. Endpoint Overview

We will implement a new **Sessions** feature module in NestJS that exposes the following REST endpoints under `/sessions`:

- **GET /sessions**  
  List all workout sessions for the authenticated user, with optional status filter and pagination.
- **POST /sessions**  
  Start a new workout session for a given workout plan.
- **GET /sessions/:id**  
  Retrieve a single workout session by ID, including nested exercises and sets.
- **PATCH /sessions/:id**  
  Update the status (`completed` or `cancelled`) of an existing session.
- **DELETE /sessions/:id**  
  Cancel (soft-delete) a session in progress.

All endpoints require JWT authentication and enforce per-user row-level security.

## 2. Request Details

### GET /sessions

- HTTP Method: GET
- URL: `/sessions`
- Query Parameters:
  - Required:
    - `status`: `'in_progress' | 'completed' | 'all'`
  - Optional:
    - `limit`: integer ≥ 1 (default 20)
    - `offset`: integer ≥ 0 (default 0)

### POST /sessions

- HTTP Method: POST
- URL: `/sessions`
- Request Body:
  ```json
  {
    "plan_id": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

### GET /sessions/:id

- HTTP Method: GET
- URL: `/sessions/:id`
- Path Parameter:
  - `id` (UUID)

### PATCH /sessions/:id

- HTTP Method: PATCH
- URL: `/sessions/:id`
- Path Parameter:
  - `id` (UUID)
- Request Body:
  ```json
  {
    "status": "completed" | "cancelled"
  }
  ```

### DELETE /sessions/:id

- HTTP Method: DELETE
- URL: `/sessions/:id`
- Path Parameter:
  - `id` (UUID)

## 3. Used Types

- **SessionQueryDto**
- **CreateWorkoutSessionDto**
- **CreateWorkoutSessionResponseDto**
- **WorkoutSessionListItemDto**
- **WorkoutSessionListDto**
- **CreateSessionExerciseDto**, **SessionExerciseDto**, **UpdateSessionExerciseDto**
- **CreateExerciseSetDto**, **ExerciseSetDto**, **UpdateExerciseSetDto**
- **WorkoutSessionDto**
- **UpdateWorkoutSessionDto**

All DTOs live in `backend/src/types.ts` and are decorated with `class-validator` and `class-transformer`.

## 4. Response Details

| Endpoint             | Status | Response Body Type                |
| -------------------- | ------ | --------------------------------- |
| GET /sessions        | 200    | `WorkoutSessionListDto`           |
| POST /sessions       | 201    | `CreateWorkoutSessionResponseDto` |
| GET /sessions/:id    | 200    | `WorkoutSessionDto`               |
| PATCH /sessions/:id  | 200    | `WorkoutSessionDto`               |
| DELETE /sessions/:id | 204    | _none_                            |

Errors:

- 400 Bad Request: validation errors
- 401 Unauthorized: missing/invalid JWT
- 403 Forbidden: accessing another user’s session
- 404 Not Found: session or plan not found
- 500 Internal Server Error: unexpected failures

## 5. Data Flow

1. **Controller**

   - Parse and validate inputs via DTOs + global `ValidationPipe`.
   - Extract `userId` from JWT (via `@Request()` and `JwtAuthGuard`).
   - Call corresponding method on `SessionsService`.

2. **Service**

   - **list**: build TypeORM query on `WorkoutSession` entity with `user_id = :userId`, apply `status` filter (skip if `all`), apply pagination, map to `WorkoutSessionListItemDto`, return total count and items.
   - **create**: verify plan exists and belongs to user; instantiate new `WorkoutSession`; save; return `CreateWorkoutSessionResponseDto`.
   - **findOne**: query `WorkoutSession` with relations (`session_exercises` → `exercise_sets`), ensure `user_id = userId`, map to `WorkoutSessionDto`.
   - **update**: fetch session, verify owner and current status; apply status change and `completed_at = now()` if `completed`; save; return updated DTO.
   - **remove**: verify session exists, is in_progress, belongs to user; set status to `cancelled`, set `completed_at`; save; return void.

3. **Database**
   - New TypeORM `@Entity()` classes under `backend/src/sessions/entities`:
     - `WorkoutSession`
     - `SessionExercise`
     - `ExerciseSet`

## 6. Security Considerations

- **Authentication**: apply `@UseGuards(JwtAuthGuard)` on all routes.
- **Authorization**:
  - Enforce `user_id` checks in every query (TypeORM WHERE).
  - Rely on existing PostgreSQL row-level security policies; ensure `app.user_id` is set on connection (via a `DbUserIdInterceptor`).
- **Validation**: forbid unknown properties, whitelist DTO fields.
- **Injection**: TypeORM parameter binding prevents SQL injection.
- **Enum Guard**: validate `status` params and body via `@IsEnum(SessionStatus)`.

## 7. Error Handling

- Wrap all service methods in `try/catch`:
  - Known errors (e.g. `EntityNotFoundError`) → throw `NotFoundException`/`BadRequestException`.
  - Validation errors automatically handled by `ValidationPipe` → 400.
  - Unexpected exceptions → log via `this.logger.error()` and throw `InternalServerErrorException`.
- Business-rule errors:
  - Attempt to start session on non-existent or other-user plan → `NotFoundException` or `ForbiddenException`.
  - Attempt to update or delete a non-in-progress session → `BadRequestException`.

## 8. Performance Considerations

- **Pagination**: apply `LIMIT`/`OFFSET` on primary indexed columns.
- **Indexes**: leverage `idx_workout_sessions_user_completed` and `idx_workout_sessions_plan`.
- **Relation Loading**: for `GET /sessions/:id`, eager-load only needed relations (`session_exercises` + `exercise_sets`) to avoid N+1.
- **Caching**: consider caching frequently read sessions (optional).

## 9. Implementation Steps

1. Create a new `sessions` feature module:

   - `backend/src/sessions/sessions.module.ts`
   - `backend/src/sessions/sessions.service.ts`
   - `backend/src/sessions/sessions.controller.ts`
   - `backend/src/sessions/entities/WorkoutSession.ts`
   - `backend/src/sessions/entities/SessionExercise.ts`
   - `backend/src/sessions/entities/ExerciseSet.ts`

2. Define TypeORM entities matching `schema.sql`:

   - Decorate columns, primary keys, relations, `CreateDateColumn`, `UpdateDateColumn`.

3. Implement DTOs (already exist) and add any missing validators:

   - Add `@IsUUID()`, `@IsEnum()`, `@Type(() => Number)`, `@Min()`, `@Max()` as needed.

4. Register new module and entities in `AppModule` and `TypeOrmModule.forFeature([...])`.

5. Implement `SessionsService` methods:

   - Inject `Repository<WorkoutSession>`, `Repository<SessionExercise>`, `Repository<ExerciseSet>`, `Repository<WorkoutPlan>`.

6. Implement `SessionsController`:

   - Decorate routes with correct HTTP methods and status codes.
   - Use `@Query()`, `@Param()`, `@Body()` with DTOs.
   - Guard with `@UseGuards(JwtAuthGuard)`.

7. Add global `ValidationPipe` in `main.ts` (if not already).

8. Write unit tests for service and controller:

   - Happy paths and error scenarios.

9. Update API documentation (`@nestjs/swagger` decorators in controller and DTOs).

10. Manual testing via Postman or Swagger UI to verify correctness.
