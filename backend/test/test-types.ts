/**
 * Type definitions for E2E test responses
 */

export interface RegisterResponse {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export interface ExerciseResponse {
  id: string;
  name: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PlanExerciseResponse {
  id: string;
  exercise_id: string;
  display_order: number;
  intensity_technique: string;
  warmup_sets: number;
  working_sets: number;
  target_reps: number;
  rpe_early: number;
  rpe_last: number;
  rest_time: number;
  notes: string | null;
  created_at: string;
}

export interface WorkoutPlanResponse {
  id: string;
  plan_name: string;
  exercises: PlanExerciseResponse[];
  created_at: string;
}

export interface ExerciseSetResponse {
  id: string;
  set_type: string;
  set_index: number;
  reps: number | null;
  load: number | null;
  created_at: string;
}

export interface SessionExerciseResponse {
  id: string;
  exercise_id: string;
  display_order: number;
  notes: string | null;
  sets: ExerciseSetResponse[];
  history?: any[];
}

export interface WorkoutSessionResponse {
  id: string;
  plan_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  exercises: SessionExerciseResponse[];
}

export interface UserResponse {
  id: string;
  email: string;
  last_login_at: string | null;
  created_at: string;
}
