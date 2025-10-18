import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Intensity techniques that can be applied to exercises
 * Corresponds to intensity_technique enum in database
 */
export enum IntensityTechnique {
  DROP_SET = 'drop_set',
  PAUSE = 'pause',
  PARTIAL_LENGTH = 'partial_length',
  FAIL = 'fail',
  SUPERSET = 'superset',
  NA = 'N/A',
}

/**
 * Types of sets in a workout
 * Corresponds to set_type enum in database
 */
export enum SetType {
  WARMUP = 'warmup',
  WORKING = 'working',
}

/**
 * Status of a workout session
 * Corresponds to session_status enum in database
 */
export enum SessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// BASE ENTITY TYPES (mirroring database tables)
// ============================================================================

/**
 * User entity - represents a user in the system
 * Corresponds to users table
 */
export interface UserEntity {
  id: string; // UUID
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date | null;
  last_login_at: Date | null;
  account_created_at: Date;
}

/**
 * OAuth provider entity - links users to external OAuth providers
 * Corresponds to user_oauth_providers table
 */
export interface UserOAuthProviderEntity {
  user_id: string; // UUID
  provider_name: string;
  provider_user_id: string;
}

/**
 * Exercise entity - represents a predefined exercise
 * Corresponds to exercises table
 */
export interface ExerciseEntity {
  id: string; // UUID
  name: string;
}

/**
 * Workout plan entity - represents a user's workout plan template
 * Corresponds to workout_plans table
 */
export interface WorkoutPlanEntity {
  id: string; // UUID
  user_id: string; // UUID
  plan_name: string;
  created_at: Date;
  updated_at: Date | null;
}

/**
 * Plan exercise entity - represents an exercise within a workout plan
 * Corresponds to plan_exercises table
 */
export interface PlanExerciseEntity {
  id: string; // UUID
  plan_id: string; // UUID
  exercise_id: string; // UUID
  display_order: number;
  intensity_technique: IntensityTechnique;
  warmup_sets: number; // SMALLINT
  working_sets: number; // SMALLINT (0-4)
  target_reps: number; // SMALLINT (>=1)
  rpe_early: number; // SMALLINT (1-10)
  rpe_last: number; // SMALLINT (1-10)
  rest_time: number; // seconds (>=0)
  notes: string; // max 500 chars
}

/**
 * Workout session entity - represents an actual workout session
 * Corresponds to workout_sessions table
 */
export interface WorkoutSessionEntity {
  id: string; // UUID
  user_id: string; // UUID
  plan_id: string | null; // UUID, nullable
  status: SessionStatus;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

/**
 * Session exercise entity - represents an exercise performed in a session
 * Corresponds to session_exercises table
 */
export interface SessionExerciseEntity {
  id: string; // UUID
  session_id: string; // UUID
  plan_exercise_id: string | null; // UUID, nullable
  exercise_id: string; // UUID
  display_order: number;
  notes: string; // max 500 chars
}

/**
 * Exercise set entity - represents a single set within a session exercise
 * Corresponds to exercise_sets table
 */
export interface ExerciseSetEntity {
  id: string; // UUID
  session_exercise_id: string; // UUID
  set_type: SetType;
  set_index: number; // SMALLINT (>=1)
  reps: number; // SMALLINT (>=1)
  load: number; // NUMERIC(5,1) (>=0)
  created_at: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

/**
 * Generic query parameters for pagination
 */
export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

// ============================================================================
// AUTHENTICATION DTOs (Section 2.1)
// ============================================================================

/**
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
    format: 'password',
  })
  password: string;
}

/**
 * Response DTO after successful registration
 * Derived from UserEntity, excluding sensitive fields
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  created_at: Date;
}

/**
 * DTO for user login
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    format: 'password',
  })
  password: string;
}

/**
 * Response DTO after successful login
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

/**
 * DTO for OAuth login/registration
 */
export class OAuthLoginDto {
  @ApiProperty({
    description: 'OAuth token from provider (google|apple)',
    example: 'ya29.a0AfH6SMBx...',
  })
  token: string;
}

/**
 * Response DTO after logout
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout confirmation message',
    example: 'Successfully logged out',
  })
  message: string;
}

// ============================================================================
// USER DTOs (Section 2.2)
// ============================================================================

/**
 * DTO for user profile information
 * Derived from UserEntity, excluding sensitive fields
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  last_login_at: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  created_at: Date;
}

// ============================================================================
// EXERCISE DTOs (Section 2.3)
// ============================================================================

/**
 * DTO for exercise data
 * Directly maps to ExerciseEntity
 */
export class ExerciseDto {
  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Exercise name',
    example: 'Bench Press',
  })
  name: string;
}

/**
 * Query parameters for exercise search/listing
 */
export class ExerciseQueryDto {
  @ApiProperty({
    description: 'Maximum number of items to return',
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
    description: 'Number of items to skip',
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
    description: 'Search query for exercise name',
    example: 'bench',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Paginated response for exercise list
 */
export class ExerciseListDto {
  @ApiProperty({
    description: 'List of exercises',
    type: [ExerciseDto],
  })
  items: ExerciseDto[];

  @ApiProperty({
    description: 'Total number of exercises',
    example: 150,
  })
  total: number;
}

// ============================================================================
// WORKOUT PLAN DTOs (Section 2.4)
// ============================================================================

/**
 * DTO for workout plan list item
 * Derived from WorkoutPlanEntity, excluding user_id and updated_at
 */
export class WorkoutPlanListItemDto {
  @ApiProperty({
    description: 'Workout plan unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Workout plan name',
    example: 'Push Day',
    maxLength: 100,
  })
  plan_name: string;

  @ApiProperty({
    description: 'Plan creation timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  created_at: Date;
}

/**
 * Paginated response for workout plan list
 */
export class WorkoutPlanListDto {
  @ApiProperty({
    description: 'List of workout plans',
    type: [WorkoutPlanListItemDto],
  })
  items: WorkoutPlanListItemDto[];

  @ApiProperty({
    description: 'Total number of workout plans',
    example: 5,
  })
  total: number;
}

/**
 * Query parameters for workout plan listing
 */
export class WorkoutPlanQueryDto {
  @ApiProperty({
    description: 'Maximum number of items to return',
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
  limit?: number = 20;

  @ApiProperty({
    description: 'Number of items to skip',
    example: 0,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

/**
 * Input DTO for creating a plan exercise
 * Derived from PlanExerciseEntity, excluding id and plan_id
 */
export class PlanExerciseInputDto {
  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  exercise_id: string;

  @ApiProperty({
    description: 'Display order of exercise in the plan',
    example: 1,
    minimum: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Intensity technique applied to this exercise',
    enum: IntensityTechnique,
    example: IntensityTechnique.DROP_SET,
  })
  intensity_technique: IntensityTechnique;

  @ApiProperty({
    description: 'Number of warmup sets',
    example: 2,
    minimum: 0,
    maximum: 32767,
  })
  warmup_sets: number;

  @ApiProperty({
    description: 'Number of working sets',
    example: 3,
    minimum: 0,
    maximum: 4,
  })
  working_sets: number;

  @ApiProperty({
    description: 'Target repetitions per set',
    example: 10,
    minimum: 1,
  })
  target_reps: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for early sets',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  rpe_early: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for last set',
    example: 9,
    minimum: 1,
    maximum: 10,
  })
  rpe_last: number;

  @ApiProperty({
    description: 'Rest time between sets in seconds',
    example: 120,
    minimum: 0,
  })
  rest_time: number;

  @ApiProperty({
    description: 'Additional notes for the exercise',
    example: 'Focus on form, keep elbows tucked',
    maxLength: 500,
  })
  notes: string;
}

/**
 * Output DTO for plan exercise
 * Directly maps to PlanExerciseEntity
 */
export class PlanExerciseDto {
  @ApiProperty({
    description: 'Plan exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Workout plan unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  plan_id: string;

  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  exercise_id: string;

  @ApiProperty({
    description: 'Display order of exercise in the plan',
    example: 1,
    minimum: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Intensity technique applied to this exercise',
    enum: IntensityTechnique,
    example: IntensityTechnique.DROP_SET,
  })
  intensity_technique: IntensityTechnique;

  @ApiProperty({
    description: 'Number of warmup sets',
    example: 2,
    minimum: 0,
  })
  warmup_sets: number;

  @ApiProperty({
    description: 'Number of working sets',
    example: 3,
    minimum: 0,
    maximum: 4,
  })
  working_sets: number;

  @ApiProperty({
    description: 'Target repetitions per set',
    example: 10,
    minimum: 1,
  })
  target_reps: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for early sets',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  rpe_early: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for last set',
    example: 9,
    minimum: 1,
    maximum: 10,
  })
  rpe_last: number;

  @ApiProperty({
    description: 'Rest time between sets in seconds',
    example: 120,
    minimum: 0,
  })
  rest_time: number;

  @ApiProperty({
    description: 'Additional notes for the exercise',
    example: 'Focus on form, keep elbows tucked',
    maxLength: 500,
  })
  notes: string;
}

/**
 * Input DTO for creating a workout plan
 */
export class CreateWorkoutPlanDto {
  @ApiProperty({
    description: 'Workout plan name',
    example: 'Push Day',
    maxLength: 100,
  })
  plan_name: string;

  @ApiProperty({
    description: 'List of exercises in the plan',
    type: [PlanExerciseInputDto],
  })
  exercises: PlanExerciseInputDto[];
}

/**
 * Output DTO for workout plan with nested exercises
 */
export class WorkoutPlanDto {
  @ApiProperty({
    description: 'Workout plan unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Workout plan name',
    example: 'Push Day',
  })
  plan_name: string;

  @ApiProperty({
    description: 'List of exercises in the plan',
    type: [PlanExerciseDto],
  })
  exercises: PlanExerciseDto[];
}

/**
 * Input DTO for updating a workout plan
 */
export class UpdateWorkoutPlanDto {
  @ApiProperty({
    description: 'Updated workout plan name',
    example: 'Push Day - Updated',
    maxLength: 100,
  })
  plan_name: string;
}

// ============================================================================
// PLAN EXERCISE DTOs (Section 2.5)
// ============================================================================

/**
 * Input DTO for updating a plan exercise
 * All fields from PlanExerciseEntity except id and plan_id
 */
export class UpdatePlanExerciseDto {
  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  exercise_id: string;

  @ApiProperty({
    description: 'Display order of exercise in the plan',
    example: 1,
    minimum: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Intensity technique applied to this exercise',
    enum: IntensityTechnique,
    example: IntensityTechnique.DROP_SET,
  })
  intensity_technique: IntensityTechnique;

  @ApiProperty({
    description: 'Number of warmup sets',
    example: 2,
    minimum: 0,
  })
  warmup_sets: number;

  @ApiProperty({
    description: 'Number of working sets',
    example: 3,
    minimum: 0,
    maximum: 4,
  })
  working_sets: number;

  @ApiProperty({
    description: 'Target repetitions per set',
    example: 10,
    minimum: 1,
  })
  target_reps: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for early sets',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  rpe_early: number;

  @ApiProperty({
    description: 'RPE (Rate of Perceived Exertion) for last set',
    example: 9,
    minimum: 1,
    maximum: 10,
  })
  rpe_last: number;

  @ApiProperty({
    description: 'Rest time between sets in seconds',
    example: 120,
    minimum: 0,
  })
  rest_time: number;

  @ApiProperty({
    description: 'Additional notes for the exercise',
    example: 'Focus on form, keep elbows tucked',
    maxLength: 500,
  })
  notes: string;
}

// ============================================================================
// EXERCISE SET DTOs (Section 2.8)
// ============================================================================

/**
 * Input DTO for creating an exercise set
 * Derived from ExerciseSetEntity, excluding id, session_exercise_id, and created_at
 */
export class CreateExerciseSetDto {
  @ApiProperty({
    description: 'Type of set',
    enum: SetType,
    example: SetType.WORKING,
  })
  set_type: SetType;

  @ApiProperty({
    description: 'Set index/number within the exercise',
    example: 1,
    minimum: 1,
  })
  set_index: number;

  @ApiProperty({
    description: 'Number of repetitions performed',
    example: 10,
    minimum: 1,
  })
  reps: number;

  @ApiProperty({
    description: 'Load/weight used in kilograms',
    example: 80.5,
    minimum: 0,
    type: Number,
  })
  load: number;
}

/**
 * Output DTO for exercise set
 * Derived from ExerciseSetEntity, excluding session_exercise_id
 */
export class ExerciseSetDto {
  @ApiProperty({
    description: 'Exercise set unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Type of set',
    enum: SetType,
    example: SetType.WORKING,
  })
  set_type: SetType;

  @ApiProperty({
    description: 'Set index/number within the exercise',
    example: 1,
    minimum: 1,
  })
  set_index: number;

  @ApiProperty({
    description: 'Number of repetitions performed',
    example: 10,
    minimum: 1,
  })
  reps: number;

  @ApiProperty({
    description: 'Load/weight used in kilograms',
    example: 80.5,
    minimum: 0,
    type: Number,
  })
  load: number;

  @ApiProperty({
    description: 'Set creation timestamp',
    example: '2025-10-14T12:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  created_at: Date;
}

/**
 * Input DTO for updating an exercise set
 * Partial update - all fields are optional
 */
export class UpdateExerciseSetDto {
  @ApiProperty({
    description: 'Type of set',
    enum: SetType,
    example: SetType.WORKING,
    required: false,
  })
  set_type?: SetType;

  @ApiProperty({
    description: 'Set index/number within the exercise',
    example: 1,
    minimum: 1,
    required: false,
  })
  set_index?: number;

  @ApiProperty({
    description: 'Number of repetitions performed',
    example: 10,
    minimum: 1,
    required: false,
  })
  reps?: number;

  @ApiProperty({
    description: 'Load/weight used in kilograms',
    example: 80.5,
    minimum: 0,
    type: Number,
    required: false,
  })
  load?: number;
}

// ============================================================================
// SESSION EXERCISE DTOs (Section 2.7)
// ============================================================================

/**
 * Input DTO for creating a session exercise
 * Derived from SessionExerciseEntity, excluding id, session_id, and plan_exercise_id
 */
export class CreateSessionExerciseDto {
  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  exercise_id: string;

  @ApiProperty({
    description: 'Display order of exercise in the session',
    example: 1,
    minimum: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Additional notes for this exercise in the session',
    example: 'Felt strong today, increased weight',
    maxLength: 500,
  })
  notes: string;
}

/**
 * Output DTO for session exercise with nested sets
 */
export class SessionExerciseDto {
  @ApiProperty({
    description: 'Session exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Exercise unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  exercise_id: string;

  @ApiProperty({
    description: 'Display order of exercise in the session',
    example: 1,
    minimum: 0,
  })
  display_order: number;

  @ApiProperty({
    description: 'Additional notes for this exercise in the session',
    example: 'Felt strong today, increased weight',
    maxLength: 500,
  })
  notes: string;

  @ApiProperty({
    description: 'List of sets performed for this exercise',
    type: [ExerciseSetDto],
  })
  sets: ExerciseSetDto[];
}

/**
 * Input DTO for updating a session exercise
 * Partial update - notes and display_order are optional
 */
export class UpdateSessionExerciseDto {
  @ApiProperty({
    description: 'Additional notes for this exercise in the session',
    example: 'Felt strong today, increased weight',
    maxLength: 500,
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Display order of exercise in the session',
    example: 1,
    minimum: 0,
    required: false,
  })
  display_order?: number;
}

// ============================================================================
// WORKOUT SESSION DTOs (Section 2.6)
// ============================================================================

/**
 * DTO for workout session list item
 * Derived from WorkoutSessionEntity
 */
export class WorkoutSessionListItemDto {
  @ApiProperty({
    description: 'Workout session unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.IN_PROGRESS,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Session start timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  started_at: Date;

  @ApiProperty({
    description: 'Session completion timestamp',
    example: '2025-10-14T13:30:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completed_at: Date | null;
}

/**
 * Paginated response for workout session list
 */
export class WorkoutSessionListDto {
  @ApiProperty({
    description: 'List of workout sessions',
    type: [WorkoutSessionListItemDto],
  })
  items: WorkoutSessionListItemDto[];

  @ApiProperty({
    description: 'Total number of workout sessions',
    example: 42,
  })
  total: number;
}

/**
 * Query parameters for session listing
 */
export class SessionQueryDto {
  @ApiProperty({
    description: 'Maximum number of items to return',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  limit?: number;

  @ApiProperty({
    description: 'Number of items to skip',
    example: 0,
    required: false,
    minimum: 0,
  })
  offset?: number;

  @ApiProperty({
    description: 'Filter by session status',
    enum: [...Object.values(SessionStatus), 'all'],
    example: SessionStatus.COMPLETED,
    required: false,
  })
  status?: SessionStatus | 'all';
}

/**
 * Input DTO for creating a workout session
 */
export class CreateWorkoutSessionDto {
  @ApiProperty({
    description: 'Workout plan unique identifier to base session on',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  plan_id: string;
}

/**
 * Response DTO after creating a workout session
 * Derived from WorkoutSessionEntity
 */
export class CreateWorkoutSessionResponseDto {
  @ApiProperty({
    description: 'Workout session unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.IN_PROGRESS,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Session start timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  started_at: Date;
}

/**
 * Output DTO for workout session with nested exercises
 */
export class WorkoutSessionDto {
  @ApiProperty({
    description: 'Workout session unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.IN_PROGRESS,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Session start timestamp',
    example: '2025-10-14T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  started_at: Date;

  @ApiProperty({
    description: 'Session completion timestamp',
    example: '2025-10-14T13:30:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  completed_at: Date | null;

  @ApiProperty({
    description: 'List of exercises performed in this session',
    type: [SessionExerciseDto],
  })
  exercises: SessionExerciseDto[];
}

/**
 * Input DTO for updating a workout session
 */
export class UpdateWorkoutSessionDto {
  @ApiProperty({
    description: 'Updated session status',
    enum: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
    example: SessionStatus.COMPLETED,
  })
  status: SessionStatus.COMPLETED | SessionStatus.CANCELLED;
}
