/**
 * View Models for frontend components
 * These types transform API DTOs into component-friendly structures
 */

import type { IntensityTechnique } from "./api";

/**
 * ViewModel for a single plan item in the list view
 * Transformed from WorkoutPlanListItemDto
 */
export interface PlanListItemVM {
  id: string;
  planName: string;
  createdAt: Date;
}

/**
 * ViewModel for paginated plans response
 * Transformed from WorkoutPlanListDto
 */
export interface PaginatedPlansVM {
  items: PlanListItemVM[];
  total: number;
}

/**
 * ViewModel for plan exercise in create/edit forms
 * Extends PlanExerciseInputDto with display name
 */
export interface PlanExerciseVM {
  exercise_id: string;
  exercise_name: string; // For display purposes
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
 * Form validation errors for plan creation
 */
export interface PlanFormErrors {
  planName?: string;
  exercises?: string;
  exerciseErrors?: Map<number, Partial<Record<keyof PlanExerciseVM, string>>>;
}
