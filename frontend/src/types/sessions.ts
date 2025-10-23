/**
 * Session Types - API DTOs and ViewModels for Sessions View
 * Based on sessions-view-implementation-plan.md
 */

// ============================================================================
// ENUMS
// ============================================================================

export const SessionStatus = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type SessionStatus =
  (typeof SessionStatus)[keyof typeof SessionStatus];

export const SetType = {
  WARMUP: "warmup",
  WORKING: "working",
} as const;

export type SetType = (typeof SetType)[keyof typeof SetType];

export type FilterStatus = SessionStatus | "all";

// ============================================================================
// API DTOs
// ============================================================================

/**
 * Query parameters for session listing
 */
export interface SessionQueryDto {
  limit?: number;
  offset?: number;
  status?: FilterStatus;
}

/**
 * Single workout session item from list endpoint
 */
export interface WorkoutSessionListItemDto {
  id: string;
  status: SessionStatus;
  started_at: string; // ISO date string
  completed_at: string | null; // ISO date string
}

/**
 * Paginated response for workout session list
 */
export interface WorkoutSessionListDto {
  items: WorkoutSessionListItemDto[];
  total: number;
}

/**
 * Input DTO for creating a workout session
 */
export interface CreateWorkoutSessionDto {
  plan_id: string;
}

/**
 * Response DTO after creating a workout session
 */
export interface CreateWorkoutSessionResponseDto {
  id: string;
  status: SessionStatus;
  started_at: string; // ISO date string
}

/**
 * Input DTO for updating a workout session
 */
export interface UpdateWorkoutSessionDto {
  status: "completed" | "cancelled";
}

/**
 * Exercise set DTO
 */
export interface ExerciseSetDto {
  id: string;
  set_type: SetType;
  set_index: number;
  reps: number;
  load: number;
  created_at: string; // ISO date string
}

/**
 * Input DTO for creating an exercise set
 */
export interface CreateExerciseSetDto {
  set_type: SetType;
  set_index: number;
  reps: number;
  load: number;
}

/**
 * Input DTO for updating an exercise set
 */
export interface UpdateExerciseSetDto {
  set_type?: SetType;
  set_index?: number;
  reps?: number;
  load?: number;
}

/**
 * Session exercise DTO
 */
export interface SessionExerciseDto {
  id: string;
  exercise_id: string;
  display_order: number;
  notes: string;
  sets: ExerciseSetDto[];
}

/**
 * Input DTO for creating a session exercise
 */
export interface CreateSessionExerciseDto {
  exercise_id: string;
  display_order: number;
  notes: string;
}

/**
 * Input DTO for updating a session exercise
 */
export interface UpdateSessionExerciseDto {
  notes?: string;
  display_order?: number;
}

/**
 * Recent history entry for an exercise
 */
export interface ExerciseHistoryEntry {
  date: string; // ISO date string
  reps: number;
  load: number;
}

/**
 * Full workout session detail
 */
export interface WorkoutSessionDto {
  id: string;
  status: SessionStatus;
  started_at: string; // ISO date string
  completed_at: string | null; // ISO date string
  exercises: SessionExerciseDto[];
}

/**
 * Extended session exercise with additional display data
 */
export interface SessionExerciseDetailDto extends SessionExerciseDto {
  exercise_name: string;
  warmup_sets: number;
  working_sets: number;
  target_reps: number;
  rpe_early: number;
  rpe_last: number;
  rest_time: number;
  intensity_technique: string;
  history: ExerciseHistoryEntry[];
}

/**
 * Full workout session detail with extended exercise data
 */
export interface WorkoutSessionDetailDto {
  id: string;
  status: SessionStatus;
  started_at: string; // ISO date string
  completed_at: string | null; // ISO date string
  exercises: SessionExerciseDetailDto[];
}

// ============================================================================
// VIEW MODELS
// ============================================================================

/**
 * ViewModel for session card in list view
 */
export interface SessionCardViewModel {
  id: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * ViewModel for set input in session detail
 */
export interface SetViewModel {
  id?: string; // undefined for new sets
  setType: SetType;
  setIndex: number;
  reps?: number;
  load?: number;
}

/**
 * ViewModel for exercise accordion in session detail
 */
export interface ExerciseAccordionViewModel {
  id: string;
  exerciseId: string;
  exerciseName: string;
  displayOrder: number;
  warmupSets: number;
  workingSets: number;
  targetReps: number;
  rpeEarly: number;
  rpeLast: number;
  restTime: number;
  intensityTechnique: string;
  notes: string;
  history: ExerciseHistoryEntry[];
  sets: SetViewModel[];
}

/**
 * ViewModel for session detail page
 */
export interface SessionDetailViewModel {
  id: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  exercises: ExerciseAccordionViewModel[];
}

// ============================================================================
// FORM STATE
// ============================================================================

/**
 * Form state for session detail page
 */
export interface SessionFormState {
  exercises: {
    [exerciseId: string]: {
      notes: string;
      sets: SetViewModel[];
    };
  };
}

/**
 * Form validation errors for session detail
 */
export interface SessionFormErrors {
  [exerciseId: string]: {
    notes?: string;
    sets?: {
      [setIndex: number]: {
        reps?: string;
        load?: string;
      };
    };
  };
}

