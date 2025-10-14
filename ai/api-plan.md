# REST API Plan

## 1. Resources

- **User** (`users`): Represents application users.
- **OAuthProvider** (`user_oauth_providers`): Stores external OAuth provider data per user.
- **Exercise** (`exercises`): Predefined list of exercises.
- **WorkoutPlan** (`workout_plans`): Templates of exercises defined by users.
- **PlanExercise** (`plan_exercises`): Exercises within a plan, with order and parameters.
- **WorkoutSession** (`workout_sessions`): User sessions based on plans.
- **SessionExercise** (`session_exercises`): Exercises performed in a session.
- **ExerciseSet** (`exercise_sets`): Individual sets within a session exercise.

## 2. Endpoints

### 2.1 Authentication

#### POST /auth/register

- Description: Register a new user with email and password.
- Request:

```json
{ "email": "string (valid email)", "password": "string (>=8 chars)" }
```

- Response 201:

```json
{ "id": "UUID", "email": "string", "created_at": "timestamp" }
```

- Errors: 400 validation, 409 email exists

#### POST /auth/login

- Description: Authenticate with email/password.
- Request:

```json
{ "email": "string", "password": "string" }
```

- Response 200:

```json
{ "accessToken": "JWT", "refreshToken": "JWT" }
```

- Errors: 400 validation, 401 invalid credentials

#### POST /auth/oauth/:provider

- Description: Login or register via OAuth provider (google|apple).
- Request:

```json
{ "token": "OAuth token from provider" }
```

- Response 200: same as login
- Errors: 400, 401

#### POST /auth/logout

- Description: Invalidate token / clear session.
- Request: Bearer token
- Response 200: `{ "message": "Logged out" }`

### 2.2 Users

#### GET /users/me

- Description: Retrieve current user profile.
- Response 200:

```json
{
  "id": "UUID",
  "email": "string",
  "last_login_at": "timestamp",
  "created_at": "timestamp"
}
```

### 2.3 Exercises

#### GET /exercises

- Description: List exercises with autocomplete.
- Query: `?search=string&limit= number (default 10)&offset=number`
- Response 200:

```json
{  "items": [{"id":"UUID","name":"string"}],  "total":number}
```

#### GET /exercises/:id

- Description: Retrieve exercise details.
- Response 200:

```json
{ "id": "UUID", "name": "string" }
```

### 2.4 Workout Plans

#### GET /plans

- Description: List user's workout plans.
- Query: `?limit=&offset=` (pagination)
- Response:

```json
{  "items":[{"id":"UUID","plan_name":"string","created_at":"t"}],  "total":number}
```

#### POST /plans

- Description: Create new workout plan.
- Request:

```json
{  "plan_name":"string (max100)",  "exercises":[{"exercise_id":"UUID","display_order":number,"intensity_technique":"enum","warmup_sets":number,"working_sets":number,"target_reps":number,"rpe_early":number,"rpe_last":number,"rest_time":number,"notes":"string(max500)"}]}
```

- Response 201: created plan with nested exercises

#### GET /plans/:id

- Description: Get plan with exercises ordered.
- Response:

```json
{  "id":"UUID","plan_name":"string","exercises":[...]}
```

#### PUT /plans/:id

- Description: Update plan name.
- Request: `{ "plan_name":"string" }`
- Response 200: updated plan

#### DELETE /plans/:id

- Description: Delete workout plan.
- Response 204

### 2.5 Plan Exercises

#### PUT /plans/:planId/exercises/:id

- Description: Update a plan exercise's parameters.
- Request: same as exercise object above
- Response 200

#### DELETE /plans/:planId/exercises/:id

- Description: Remove exercise from plan.
- Response 204

### 2.6 Workout Sessions

#### GET /sessions

- Description: List sessions with filter by status.
- Query: `?status=in_progress|completed|all&limit=&offset=`
- Response 200:

```json
{  "items":[{"id":"UUID","status":"enum","started_at":"t","completed_at":"t"}],"total":number}
```

#### POST /sessions

- Description: Start a new workout session.
- Request:

```json
{ "plan_id": "UUID" }
```

- Response 201:

```json
{ "id": "UUID", "status": "in_progress", "started_at": "timestamp" }
```

#### GET /sessions/:id

- Description: Retrieve session with nested exercises and sets.
- Response: detailed session object

#### PATCH /sessions/:id

- Description: Update session status or completed_at.
- Request: `{ "status":"completed|cancelled"}`
- Response 200

#### DELETE /sessions/:id

- Description: Cancel session (if in progress).
- Response 204

### 2.7 Session Exercises

#### POST /sessions/:sessionId/exercises

- Description: Add exercise to session (if plan not set).
- Request: `{ "exercise_id":"UUID","display_order":number,"notes":"string"}`
- Response 201

#### PUT /sessions/:sessionId/exercises/:id

- Description: Update session exercise (notes/order)
- Response 200

#### DELETE /sessions/:sessionId/exercises/:id

- Description: Remove session exercise
- Response 204

### 2.8 Exercise Sets

#### POST /sessions/:sessionId/exercises/:sessionExerciseId/sets

- Description: Log a set for a session exercise.
- Request:

```json
{  "set_type":"warmup|working","set_index":number(>=1),"reps":number(>=1),"load":number(>=0.0)}
```

- Response 201

#### PUT /sessions/:sessionId/exercises/:sessionExerciseId/sets/:id

- Description: Update set data
- Response 200

#### DELETE /sessions/:sessionId/exercises/:sessionExerciseId/sets/:id

- Description: Delete a set
- Response 204

## 3. Authentication and Authorization

- Bearer JWT via Passport-JWT
- OAuth flows for Google/Apple using Passport strategies
- Use NestJS Guards to enforce authentication
- Middleware to set `app.user_id` for RLS in PostgreSQL
- Role: single-tenant per user

## 4. Validation and Business Logic

- Use `class-validator` for DTOs reflecting schema CHECK constraints:
  - `plan_name` maxLength 100, not empty
  - `notes` maxLength 500
  - Numeric fields: `warmup_sets` >=0, `working_sets` 0-4, `target_reps` >=1, `rpe_early`/`rpe_last` between 1-10, `rest_time` >=0, `set_index`>=1, `reps`>=1, `load`>=0
- Business logic in controllers/services:
  - On session completion, calculate `completed_at` timestamp
  - Fetch last 5 sets per exercise for history (PRD US-014)
  - Prevent deleting non-empty plans if sessions exist (optional)
  - Ensure partial sessions can be saved
- Pagination: limit/offset across list endpoints
