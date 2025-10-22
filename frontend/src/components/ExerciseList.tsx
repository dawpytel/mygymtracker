/**
 * ExerciseList Component
 * Displays a list of exercises in the workout plan
 */

import { ExerciseItem } from "./ExerciseItem";
import type { PlanExerciseVM } from "../types/viewModels";

interface ExerciseListProps {
  exercises: PlanExerciseVM[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
}

export function ExerciseList({
  exercises,
  onEdit,
  onDelete,
  disabled = false,
}: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <div
        className="text-center py-12 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
        role="status"
      >
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
          No exercises added yet. Use the search above to add exercises to your
          plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Exercises ({exercises.length})
      </h3>
      <div className="space-y-3" role="list">
        {exercises.map((exercise, index) => (
          <div key={`${exercise.exercise_id}-${index}`} role="listitem">
            <ExerciseItem
              exercise={exercise}
              index={index}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

