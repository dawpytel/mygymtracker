# API Endpoint Implementation Plan: Workout Plans and Plan Exercises

## 1. Endpoint Overview

This document covers the implementation plan for the following endpoints in the workout plans domain:

- **POST /plans**: Create a new workout plan with nested exercises.
- **GET /plans/:id**: Retrieve a workout plan and its exercises, ordered by display order.
- **PUT /plans/:id**: Update the name of an existing workout plan.
- **DELETE /plans/:id**: Delete a workout plan and its related exercises.
- **PUT /plans/:planId/exercises/:id**: Update parameters of an exercise within a workout plan.
- **DELETE /plans/:planId/exercises/:id**: Remove an exercise from a workout plan.

## 2. Request Details

### POST /plans

- HTTP Method: POST
- URL Structure: `/plans`
- Parameters:
  - Required:
    - `plan_name` (string, max 100)
    - `exercises`: array of objects, each containing:
      - `exercise_id` (UUID)
      - `display_order` (number)
      - `intensity_technique` (enum IntensityTechnique)
      - `warmup_sets` (number)
      - `working_sets` (number)
      - `target_reps` (number)
      - `rpe_early` (number)
      - `rpe_last` (number)
      - `rest_time` (number)
      - `notes` (string, max 500)

### GET /plans/:id

- HTTP Method: GET
- URL Structure: `/plans/:id`
- Parameters:
  - Required:
    - `id` (path, UUID)

### PUT /plans/:id

- HTTP Method: PUT
- URL Structure: `/plans/:id`
- Parameters:
  - Required:
    - `id` (path, UUID)
    - Request body: `{ "plan_name": "string (max100)" }`

### DELETE /plans/:id

- HTTP Method: DELETE
- URL Structure: `/plans/:id`
- Parameters:
  - Required:
    - `id` (path, UUID)

### PUT /plans/:planId/exercises/:id

- HTTP Method: PUT
- URL Structure: `/plans/:planId/exercises/:id`
- Parameters:
  - Required:
    - `planId` (path, UUID)
    - `id` (path, UUID for PlanExercise)
    - Request body: same shape as in POST `/plans` exercise objects

### DELETE /plans/:planId/exercises/:id

- HTTP Method: DELETE
- URL Structure: `/plans/:planId/exercises/:id`
- Parameters:
  - Required:
    - `planId` (path, UUID)
    - `id` (path, UUID for PlanExercise)

## 3. Used Types

- DTOs:
  - `CreateWorkoutPlanDto`
  - `PlanExerciseInputDto`
  - `WorkoutPlanDto`
  - `PlanExerciseDto`
  - `UpdateWorkoutPlanDto`
  - `UpdatePlanExerciseDto`
- Command/Query Models (service layer):
  - `CreateWorkoutPlanCommand`
  - `GetWorkoutPlanQuery`
  - `UpdateWorkoutPlanCommand`
  - `DeleteWorkoutPlanCommand`
  - `UpdatePlanExerciseCommand`
  - `DeletePlanExerciseCommand`

## 4. Response Details

- **POST /plans**: 201 Created
  ```json
  { "id": "UUID", "plan_name": "string", "exercises": [ {... PlanExerciseDto ...} ] }
  ```
- **GET /plans/:id**: 200 OK
  ```json
  { "id": "UUID", "plan_name": "string", "exercises": [ {... PlanExerciseDto ...} ] }
  ```
- **PUT /plans/:id**: 200 OK
  ```json
  { "id": "UUID", "plan_name": "string" }
  ```
- **DELETE /plans/:id**: 204 No Content
- **PUT /plans/:planId/exercises/:id**: 200 OK
  ```json
  { "id": "UUID", ... updated PlanExerciseDto ... }
  ```
- **DELETE /plans/:planId/exercises/:id**: 204 No Content

## 5. Data Flow

1. **Controller** receives request → DTO validation via `ValidationPipe`.
2. Map DTO to command/query model.
3. **Service** (e.g., `WorkoutPlansService`) executes business logic:
   - For create: open transaction, insert `WorkoutPlanEntity`, insert related `PlanExerciseEntity` records preserving order.
   - For fetch: load plan and its exercises ordered by `display_order`.
   - For update plan name: update and return updated entity.
   - For delete plan: cascade delete plan_exercises via database.
   - For update exercise: find by id & plan_id, apply updates, save.
   - For delete exercise: remove by id & plan_id.
4. Service returns entity/DTO.
5. **Controller** serializes and returns HTTP response.

## 6. Security Considerations

- **Authentication**: Apply JWT guard on all routes.
- **Authorization**: Verify `user_id` of plan matches JWT subject (via row-level security or manual check).
- **Input validation**: Ensure DTO constraints.
- **SQL injection**: Use TypeORM parameter binding.
- **Excessive payload**: Enforce max array length or field sizes.
- **Rate limiting**: Consider global rate limiter.

## 7. Error Handling

- **400 Bad Request**: DTO validation failures.
- **401 Unauthorized**: Missing/invalid JWT.
- **403 Forbidden**: Accessing resource not owned by user.
- **404 Not Found**: Plan or PlanExercise not found.
- **409 Conflict**: Duplicate `plan_name` for user.
- **500 Internal Server Error**: Unhandled exceptions. Log stack trace via `Logger.error`.

## 8. Performance Considerations

- Bulk insert exercises in a single transaction.
- Add database index on `(user_id, plan_name)` (unique constraint) and on `plan_id`.
- Use pagination if expanding listing endpoints.
- Fetch only needed fields via query builder.

## 9. Implementation Steps

1. Validate and review existing DTOs; add any missing decorators for new endpoints.
2. In `WorkoutPlansService`:
   - Implement `createPlan(command: CreateWorkoutPlanCommand)` with TypeORM transaction.
   - Implement `getPlanById(query: GetWorkoutPlanQuery)` loading `PlanExerciseEntity` ordered.
   - Implement `updatePlanName(command: UpdateWorkoutPlanCommand)`.
   - Implement `deletePlan(command: DeleteWorkoutPlanCommand)`.
   - Implement `updatePlanExercise(command: UpdatePlanExerciseCommand)`.
   - Implement `deletePlanExercise(command: DeletePlanExerciseCommand)`.
3. In `workout-plans.controller.ts`:
   - Add routes and handlers for POST, GET, PUT, DELETE `/plans` and PUT, DELETE `/plans/:planId/exercises/:id`.
   - Inject `WorkoutPlansService` and apply `@UseGuards(JwtAuthGuard)`.
   - Use `@Param`, `@Body`, `@ValidationPipe`.
4. Add Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`).
5. Write unit and integration tests for each endpoint, covering success and error paths.
6. Ensure database migrations reflect any schema changes (none for existing schema).
7. Update API documentation and versioning if necessary.
8. Code review and merge.

---

_End of Implementation Plan_
