/**
 * API Types - mirrors backend DTOs
 * These types represent the shape of data from the API
 */

// ============================================================================
// ENUMS (matching backend types.ts)
// ============================================================================

export const IntensityTechnique = {
  DROP_SET: "drop_set",
  PAUSE: "pause",
  PARTIAL_LENGTH: "partial_length",
  FAIL: "fail",
  SUPERSET: "superset",
  NA: "N/A",
} as const;

export type IntensityTechnique =
  (typeof IntensityTechnique)[keyof typeof IntensityTechnique];

// ============================================================================
// EXERCISE TYPES
// ============================================================================

/**
 * Exercise data from API
 */
export interface ExerciseDto {
  id: string;
  name: string;
}

/**
 * Query parameters for exercise search/listing
 */
export interface ExerciseQueryDto {
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Paginated response for exercise list
 */
export interface ExerciseListDto {
  items: ExerciseDto[];
  total: number;
}

// ============================================================================
// WORKOUT PLAN TYPES
// ============================================================================

/**
 * Query parameters for workout plan listing
 */
export interface WorkoutPlanQueryDto {
  limit?: number;
  offset?: number;
}

/**
 * Single workout plan item from list endpoint
 */
export interface WorkoutPlanListItemDto {
  id: string;
  plan_name: string;
  created_at: string; // ISO date string from API
}

/**
 * Paginated response for workout plan list
 */
export interface WorkoutPlanListDto {
  items: WorkoutPlanListItemDto[];
  total: number;
}

/**
 * Input DTO for creating a plan exercise
 */
export interface PlanExerciseInputDto {
  exercise_id: string;
  display_order: number;
  intensity_technique: IntensityTechnique;
  warmup_sets: number;
  working_sets: number;
  target_reps: number;
  rpe_early: number;
  rpe_last: number;
  rest_time: number;
  notes: string;
}

/**
 * Output DTO for plan exercise
 */
export interface PlanExerciseDto extends PlanExerciseInputDto {
  id: string;
  plan_id: string;
}

/**
 * Input DTO for creating a workout plan
 */
export interface CreateWorkoutPlanDto {
  plan_name: string;
  exercises: PlanExerciseInputDto[];
}

/**
 * Output DTO for workout plan with nested exercises
 */
export interface WorkoutPlanDto {
  id: string;
  plan_name: string;
  exercises: PlanExerciseDto[];
}
