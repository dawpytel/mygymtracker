/**
 * Custom hook for managing workout session detail
 * Handles fetching session data, managing form state, and saving changes
 */

import { useState, useCallback, useEffect } from "react";
import { apiGet, apiPatch, apiDelete, apiPost } from "../lib/api";
import type {
  WorkoutSessionDetailDto,
  SessionDetailViewModel,
  SessionFormState,
  SessionFormErrors,
  SetViewModel,
  UpdateWorkoutSessionDto,
  CreateExerciseSetDto,
  UpdateExerciseSetDto,
  UpdateSessionExerciseDto,
} from "../types/sessions";
import { SetType } from "../types/sessions";

interface UseSessionDetailState {
  session: SessionDetailViewModel | null;
  formState: SessionFormState;
  errors: SessionFormErrors;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  saving: boolean;
}

interface UseSessionDetailReturn extends UseSessionDetailState {
  fetchSession: () => Promise<void>;
  updateSetData: (
    exerciseId: string,
    setIndex: number,
    data: Partial<SetViewModel>
  ) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  saveSession: () => Promise<void>;
  cancelSession: () => Promise<void>;
  completeSession: () => Promise<void>;
}

/**
 * Transform API DTO to ViewModel
 */
function transformToViewModel(
  dto: WorkoutSessionDetailDto
): SessionDetailViewModel {
  return {
    id: dto.id,
    status: dto.status,
    startedAt: new Date(dto.started_at),
    completedAt: dto.completed_at ? new Date(dto.completed_at) : undefined,
    exercises: dto.exercises.map((exercise) => {
      // Transform existing sets or create placeholders based on plan
      let sets: SetViewModel[];
      
      if (exercise.sets.length === 0) {
        // Create placeholders if no sets exist
        const placeholderSets: SetViewModel[] = [];
        
        // Create warmup set placeholders
        for (let i = 1; i <= exercise.warmup_sets; i++) {
          placeholderSets.push({
            setType: SetType.WARMUP,
            setIndex: i,
            reps: undefined,
            load: undefined,
          });
        }
        
        // Create working set placeholders
        for (let i = 1; i <= exercise.working_sets; i++) {
          placeholderSets.push({
            setType: SetType.WORKING,
            setIndex: i,
            reps: undefined,
            load: undefined,
          });
        }
        
        sets = placeholderSets;
      } else {
        // Transform existing sets
        sets = exercise.sets.map((set) => ({
          id: set.id,
          setType: set.set_type,
          setIndex: set.set_index,
          reps: set.reps,
          load: set.load,
        }));
      }

      return {
        id: exercise.id,
        exerciseId: exercise.exercise_id,
        exerciseName: exercise.exercise_name,
        displayOrder: exercise.display_order,
        warmupSets: exercise.warmup_sets,
        workingSets: exercise.working_sets,
        targetReps: exercise.target_reps,
        rpeEarly: exercise.rpe_early,
        rpeLast: exercise.rpe_last,
        restTime: exercise.rest_time,
        intensityTechnique: exercise.intensity_technique,
        notes: exercise.notes || '',
        history: exercise.history || [],
        sets,
      };
    }),
  };
}

/**
 * Initialize form state from session data
 */
function initializeFormState(
  session: SessionDetailViewModel
): SessionFormState {
  const exercises: SessionFormState["exercises"] = {};

  session.exercises.forEach((exercise) => {
    exercises[exercise.id] = {
      notes: exercise.notes,
      sets: exercise.sets,
    };
  });

  return { exercises };
}

/**
 * Hook for managing workout session detail data and operations
 * @param sessionId - Session ID to fetch
 */
export function useSessionDetail(
  sessionId: string
): UseSessionDetailReturn {
  const [state, setState] = useState<UseSessionDetailState>({
    session: null,
    formState: { exercises: {} },
    errors: {},
    loading: false,
    error: null,
    isDirty: false,
    saving: false,
  });

  /**
   * Fetch session detail from API
   */
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      console.warn("useSessionDetail: No sessionId provided");
      return;
    }

    console.log("useSessionDetail: Fetching session", sessionId);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiGet<WorkoutSessionDetailDto>(
        `/sessions/${sessionId}`
      );
      console.log("useSessionDetail: API response", response);
      
      const session = transformToViewModel(response);
      console.log("useSessionDetail: Transformed session", session);
      
      const formState = initializeFormState(session);
      console.log("useSessionDetail: Form state", formState);

      setState((prev) => ({
        ...prev,
        session,
        formState,
        loading: false,
        error: null,
        isDirty: false,
      }));
    } catch (error) {
      console.error("useSessionDetail: Fetch error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch session details";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [sessionId]);

  /**
   * Update set data in form state
   */
  const updateSetData = useCallback(
    (exerciseId: string, setIndex: number, data: Partial<SetViewModel>) => {
      setState((prev) => {
        const exerciseState = prev.formState.exercises[exerciseId];
        if (!exerciseState) {
          return prev;
        }

        const updatedSets = [...exerciseState.sets];
        const setIdx = updatedSets.findIndex((s) => s.setIndex === setIndex);

        if (setIdx !== -1) {
          updatedSets[setIdx] = { ...updatedSets[setIdx], ...data };
        }

        return {
          ...prev,
          formState: {
            ...prev.formState,
            exercises: {
              ...prev.formState.exercises,
              [exerciseId]: {
                ...exerciseState,
                sets: updatedSets,
              },
            },
          },
          isDirty: true,
        };
      });
    },
    []
  );

  /**
   * Update exercise notes in form state
   */
  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    setState((prev) => {
      const exerciseState = prev.formState.exercises[exerciseId];
      if (!exerciseState) {
        return prev;
      }

      return {
        ...prev,
        formState: {
          ...prev.formState,
          exercises: {
            ...prev.formState.exercises,
            [exerciseId]: {
              ...exerciseState,
              notes,
            },
          },
        },
        isDirty: true,
      };
    });
  }, []);

  /**
   * Save session changes (sets and notes)
   */
  const saveSession = useCallback(async () => {
    if (!state.session) {
      return;
    }

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      // Save sets and notes for each exercise
      for (const exercise of state.session.exercises) {
        const formExercise = state.formState.exercises[exercise.id];
        if (!formExercise) {
          continue;
        }

        // Update exercise notes if changed
        if (formExercise.notes !== exercise.notes) {
          const updateData: UpdateSessionExerciseDto = {
            notes: formExercise.notes,
          };
          await apiPatch(
            `/sessions/${sessionId}/exercises/${exercise.id}`,
            updateData
          );
        }

        // Update or create sets
        for (const set of formExercise.sets) {
          if (set.id) {
            // Update existing set
            const updateData: UpdateExerciseSetDto = {
              reps: set.reps,
              load: set.load,
            };
            await apiPatch(
              `/sessions/${sessionId}/exercises/${exercise.id}/sets/${set.id}`,
              updateData
            );
          } else if (set.reps !== undefined && set.load !== undefined) {
            // Create new set
            const createData: CreateExerciseSetDto = {
              set_type: set.setType,
              set_index: set.setIndex,
              reps: set.reps,
              load: set.load,
            };
            await apiPost(
              `/sessions/${sessionId}/exercises/${exercise.id}/sets`,
              createData
            );
          }
        }
      }

      setState((prev) => ({
        ...prev,
        saving: false,
        isDirty: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save session";
      setState((prev) => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [sessionId, state.session, state.formState]);

  /**
   * Complete session
   */
  const completeSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const updateData: UpdateWorkoutSessionDto = {
        status: "completed" as const,
      };
      await apiPatch(`/sessions/${sessionId}`, updateData);

      setState((prev) => ({
        ...prev,
        saving: false,
        isDirty: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete session";
      setState((prev) => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [sessionId]);

  /**
   * Cancel session
   */
  const cancelSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      await apiDelete(`/sessions/${sessionId}`);

      setState((prev) => ({
        ...prev,
        saving: false,
        isDirty: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to cancel session";
      setState((prev) => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [sessionId]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    ...state,
    fetchSession,
    updateSetData,
    updateExerciseNotes,
    saveSession,
    cancelSession,
    completeSession,
  };
}

