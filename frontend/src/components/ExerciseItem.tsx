/**
 * ExerciseItem Component
 * Displays a summary of a single exercise in the plan with edit/delete actions
 */

import type { PlanExerciseVM } from "../types/viewModels";

interface ExerciseItemProps {
  exercise: PlanExerciseVM;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ExerciseItem({
  exercise,
  index,
  onEdit,
  onDelete,
  disabled = false,
}: ExerciseItemProps) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Exercise Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full flex-shrink-0">
              {index + 1}
            </span>
            <h4 className="text-base font-semibold text-gray-900 truncate">
              {exercise.exercise_name}
            </h4>
          </div>

          {/* Exercise Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Sets:</span> {exercise.warmup_sets} warmup,{" "}
              {exercise.working_sets} working
            </div>
            <div>
              <span className="font-medium">Target:</span> {exercise.target_reps} reps
            </div>
            <div>
              <span className="font-medium">RPE:</span> {exercise.rpe_early}-
              {exercise.rpe_last}
            </div>
            <div>
              <span className="font-medium">Rest:</span> {exercise.rest_time}s
            </div>
            <div className="col-span-2">
              <span className="font-medium">Technique:</span>{" "}
              {exercise.intensity_technique.replace(/_/g, " ")}
            </div>
            {exercise.notes && (
              <div className="col-span-2">
                <span className="font-medium">Notes:</span>{" "}
                <span className="italic">{exercise.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Edit ${exercise.exercise_name}`}
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

