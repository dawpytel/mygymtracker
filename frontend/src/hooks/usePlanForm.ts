/**
 * Custom hook for managing plan creation form state
 * Handles exercises, validation, and submission
 */

import { useState, useCallback } from "react";
import { apiPost } from "../lib/api";
import type {
  ExerciseDto,
  CreateWorkoutPlanDto,
  WorkoutPlanDto,
  IntensityTechnique,
} from "../types/api";
import type { PlanExerciseVM } from "../types/viewModels";

interface UsePlanFormState {
  planName: string;
  exercises: PlanExerciseVM[];
  formErrors: string[];
  isSubmitting: boolean;
}

interface UsePlanFormReturn extends UsePlanFormState {
  setPlanName: (name: string) => void;
  addExercise: (exercise: ExerciseDto) => void;
  updateExercise: (index: number, updated: PlanExerciseVM) => void;
  removeExercise: (index: number) => void;
  validateForm: () => boolean;
  submitPlan: () => Promise<WorkoutPlanDto>;
  clearErrors: () => void;
}

/**
 * Default values for a new exercise
 */
function createDefaultExercise(
  exercise: ExerciseDto,
  displayOrder: number
): PlanExerciseVM {
  return {
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    display_order: displayOrder,
    intensity_technique: "N/A" as IntensityTechnique,
    warmup_sets: 0,
    working_sets: 3,
    target_reps: 10,
    rpe_early: 7,
    rpe_last: 9,
    rest_time: 120,
    notes: "",
  };
}

/**
 * Validates a single exercise field
 */
function validateExerciseField(
  field: keyof PlanExerciseVM,
  value: number | string
): string | null {
  switch (field) {
    case "warmup_sets":
      if (typeof value === "number" && value < 0) {
        return "Warmup sets must be 0 or greater";
      }
      break;
    case "working_sets":
      if (typeof value === "number" && (value < 0 || value > 4)) {
        return "Working sets must be between 0 and 4";
      }
      break;
    case "target_reps":
      if (typeof value === "number" && value < 1) {
        return "Target reps must be at least 1";
      }
      break;
    case "rpe_early":
    case "rpe_last":
      if (typeof value === "number" && (value < 1 || value > 10)) {
        return "RPE must be between 1 and 10";
      }
      break;
    case "rest_time":
      if (typeof value === "number" && value < 0) {
        return "Rest time must be 0 or greater";
      }
      break;
    case "notes":
      if (typeof value === "string" && value.length > 500) {
        return "Notes must be 500 characters or less";
      }
      break;
  }
  return null;
}

/**
 * Hook for managing plan form state and operations
 */
export function usePlanForm(): UsePlanFormReturn {
  const [state, setState] = useState<UsePlanFormState>({
    planName: "",
    exercises: [],
    formErrors: [],
    isSubmitting: false,
  });

  /**
   * Update plan name
   */
  const setPlanName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, planName: name, formErrors: [] }));
  }, []);

  /**
   * Add a new exercise to the list
   */
  const addExercise = useCallback((exercise: ExerciseDto) => {
    setState((prev) => {
      const newExercise = createDefaultExercise(
        exercise,
        prev.exercises.length
      );
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
        formErrors: [],
      };
    });
  }, []);

  /**
   * Update an existing exercise
   */
  const updateExercise = useCallback(
    (index: number, updated: PlanExerciseVM) => {
      setState((prev) => {
        const newExercises = [...prev.exercises];
        newExercises[index] = updated;
        return { ...prev, exercises: newExercises };
      });
    },
    []
  );

  /**
   * Remove an exercise and reindex display_order
   */
  const removeExercise = useCallback((index: number) => {
    setState((prev) => {
      const newExercises = prev.exercises
        .filter((_, i) => i !== index)
        .map((ex, i) => ({ ...ex, display_order: i }));
      return { ...prev, exercises: newExercises, formErrors: [] };
    });
  }, []);

  /**
   * Clear form errors
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, formErrors: [] }));
  }, []);

  /**
   * Validate the entire form
   */
  const validateForm = useCallback((): boolean => {
    const errors: string[] = [];

    // Validate plan name
    if (!state.planName.trim()) {
      errors.push("Plan name is required");
    } else if (state.planName.length > 100) {
      errors.push("Plan name must be 100 characters or less");
    }

    // Validate exercises list
    if (state.exercises.length === 0) {
      errors.push("At least one exercise is required");
    }

    // Validate each exercise
    state.exercises.forEach((exercise, index) => {
      const fields: Array<keyof PlanExerciseVM> = [
        "warmup_sets",
        "working_sets",
        "target_reps",
        "rpe_early",
        "rpe_last",
        "rest_time",
        "notes",
      ];

      fields.forEach((field) => {
        const error = validateExerciseField(field, exercise[field]);
        if (error) {
          errors.push(
            `Exercise ${index + 1} (${exercise.exercise_name}): ${error}`
          );
        }
      });
    });

    setState((prev) => ({ ...prev, formErrors: errors }));
    return errors.length === 0;
  }, [state.planName, state.exercises]);

  /**
   * Submit the plan to the API
   */
  const submitPlan = useCallback(async (): Promise<WorkoutPlanDto> => {
    if (!validateForm()) {
      throw new Error("Form validation failed");
    }

    setState((prev) => ({ ...prev, isSubmitting: true, formErrors: [] }));

    try {
      const dto: CreateWorkoutPlanDto = {
        plan_name: state.planName,
        exercises: state.exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          display_order: ex.display_order,
          intensity_technique: ex.intensity_technique,
          warmup_sets: ex.warmup_sets,
          working_sets: ex.working_sets,
          target_reps: ex.target_reps,
          rpe_early: ex.rpe_early,
          rpe_last: ex.rpe_last,
          rest_time: ex.rest_time,
          notes: ex.notes,
        })),
      };

      // Log the payload for debugging
      console.log("Submitting plan:", JSON.stringify(dto, null, 2));

      const response = await apiPost<WorkoutPlanDto>("/plans", dto);
      console.log("Plan created successfully:", response);
      return response;
    } catch (error) {
      console.error("Failed to create plan:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create plan";
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        formErrors: [errorMessage],
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.planName, state.exercises, validateForm]);

  return {
    ...state,
    setPlanName,
    addExercise,
    updateExercise,
    removeExercise,
    validateForm,
    submitPlan,
    clearErrors,
  };
}
