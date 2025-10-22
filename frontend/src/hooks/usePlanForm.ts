/**
 * Custom hook for managing plan creation/editing form state
 * Handles exercises, validation, and submission
 */

import { useState, useCallback, useEffect } from "react";
import { apiPost, apiPut } from "../lib/api";
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

interface UsePlanFormProps {
  planId?: string;
  initialData?: {
    planName: string;
    exercises: PlanExerciseVM[];
  };
}

interface UsePlanFormReturn extends UsePlanFormState {
  setPlanName: (name: string) => void;
  addExercise: (
    exercise: ExerciseDto,
    customValues?: Partial<PlanExerciseVM>
  ) => void;
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
export function usePlanForm(props?: UsePlanFormProps): UsePlanFormReturn {
  const { planId, initialData } = props || {};

  const [state, setState] = useState<UsePlanFormState>({
    planName: initialData?.planName || "",
    exercises: initialData?.exercises || [],
    formErrors: [],
    isSubmitting: false,
  });

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setState((prev) => ({
        ...prev,
        planName: initialData.planName,
        exercises: initialData.exercises,
      }));
    }
  }, [initialData]);

  /**
   * Update plan name
   */
  const setPlanName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, planName: name, formErrors: [] }));
  }, []);

  /**
   * Add a new exercise to the list with default or custom values
   */
  const addExercise = useCallback(
    (exercise: ExerciseDto, customValues?: Partial<PlanExerciseVM>) => {
      setState((prev) => {
        const newExercise = customValues
          ? {
              ...createDefaultExercise(exercise, prev.exercises.length),
              ...customValues,
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              display_order: prev.exercises.length,
            }
          : createDefaultExercise(exercise, prev.exercises.length);
        return {
          ...prev,
          exercises: [...prev.exercises, newExercise],
          formErrors: [],
        };
      });
    },
    []
  );

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
      if (planId) {
        // UPDATE: Send plan_name and exercises
        const updateDto = {
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

        console.log("Updating plan:", JSON.stringify(updateDto, null, 2));

        const response = await apiPut<WorkoutPlanDto>(
          `/plans/${planId}`,
          updateDto
        );

        console.log("Plan updated successfully:", response);
        return response;
      } else {
        // CREATE: Send full plan with exercises
        const createDto: CreateWorkoutPlanDto = {
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

        console.log("Creating plan:", JSON.stringify(createDto, null, 2));

        const response = await apiPost<WorkoutPlanDto>("/plans", createDto);

        console.log("Plan created successfully:", response);
        return response;
      }
    } catch (error) {
      console.error(
        planId ? "Failed to update plan:" : "Failed to create plan:",
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${planId ? "update" : "create"} plan`;
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        formErrors: [errorMessage],
      }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.planName, state.exercises, validateForm, planId]);

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
