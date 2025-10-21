/**
 * PlanForm Component
 * Main form for creating/editing workout plans
 */

import { useCallback } from "react";
import { usePlanForm } from "../hooks/usePlanForm";
import { ExerciseAutocomplete } from "./ExerciseAutocomplete";
import { FormValidationErrors } from "./FormValidationErrors";
import type { ExerciseDto } from "../types/api";

interface PlanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanForm({ onSuccess, onCancel }: PlanFormProps) {
  const {
    planName,
    exercises,
    formErrors,
    isSubmitting,
    setPlanName,
    addExercise,
    removeExercise,
    submitPlan,
  } = usePlanForm();

  /**
   * Handle exercise selection from autocomplete
   */
  const handleExerciseSelect = useCallback(
    (exercise: ExerciseDto) => {
      addExercise(exercise);
    },
    [addExercise]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        await submitPlan();
        onSuccess();
      } catch (error) {
        // Error is already handled in the hook
        console.error("Failed to submit plan:", error);
      }
    },
    [submitPlan, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormValidationErrors errors={formErrors} />

      {/* Plan Name Input */}
      <div>
        <label
          htmlFor="plan-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Plan Name <span className="text-red-500">*</span>
        </label>
        <input
          id="plan-name"
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          maxLength={100}
          required
          disabled={isSubmitting}
          placeholder="e.g., Push Day, Pull Day, Leg Day"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed px-4 py-2 border"
          aria-describedby="plan-name-hint"
        />
        <p id="plan-name-hint" className="mt-1 text-sm text-gray-500">
          {planName.length}/100 characters
        </p>
      </div>

      {/* Exercise Autocomplete */}
      <div>
        <ExerciseAutocomplete
          onSelect={handleExerciseSelect}
          disabled={isSubmitting}
        />
      </div>

      {/* Exercises List - Placeholder */}
      {exercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Exercises ({exercises.length})
          </h3>
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <div
                key={`${exercise.exercise_id}-${index}`}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <h4 className="text-base font-semibold text-gray-900">
                        {exercise.exercise_name}
                      </h4>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>
                        Sets: {exercise.warmup_sets} warmup,{" "}
                        {exercise.working_sets} working
                      </p>
                      <p>
                        Target: {exercise.target_reps} reps @ RPE{" "}
                        {exercise.rpe_early}-{exercise.rpe_last}
                      </p>
                      <p>Rest: {exercise.rest_time}s</p>
                      <p>Technique: {exercise.intensity_technique}</p>
                      {exercise.notes && (
                        <p className="italic">Notes: {exercise.notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    disabled={isSubmitting}
                    className="ml-4 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove ${exercise.exercise_name}`}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="text-center py-8 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No exercises added yet. Use the search above to add exercises to
            your plan.
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || exercises.length === 0 || !planName.trim()}
          className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Plan"}
        </button>
      </div>
    </form>
  );
}

