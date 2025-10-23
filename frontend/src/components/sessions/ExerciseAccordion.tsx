/**
 * ExerciseAccordion Component
 * Accordion for displaying and editing exercise details in a session
 */

import { useState } from "react";
import { TechniqueDescription } from "./TechniqueDescription";
import { HistoryPanel } from "./HistoryPanel";
import { SetInput } from "./SetInput";
import { NotesInput } from "./NotesInput";
import { Timer } from "./Timer";
import type { ExerciseAccordionViewModel, SetViewModel } from "../../types/sessions";

interface ExerciseAccordionProps {
  exercise: ExerciseAccordionViewModel;
  onSetChange: (setIndex: number, data: Partial<SetViewModel>) => void;
  onNotesChange: (notes: string) => void;
}

export function ExerciseAccordion({
  exercise,
  onSetChange,
  onNotesChange,
}: ExerciseAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded={isExpanded}
        aria-controls={`exercise-${exercise.id}-content`}
      >
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold text-gray-900">
            {exercise.exerciseName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>{exercise.targetReps} reps</span>
            <span>RPE {exercise.rpeEarly}-{exercise.rpeLast}</span>
            <span>{Math.floor(exercise.restTime / 60)}:{(exercise.restTime % 60).toString().padStart(2, "0")} rest</span>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div
          id={`exercise-${exercise.id}-content`}
          role="region"
          className="px-4 pb-4 space-y-4"
        >
          {/* Technique Description */}
          <TechniqueDescription technique={exercise.intensityTechnique} />

          {/* History Panel */}
          {exercise.history.length > 0 && (
            <HistoryPanel history={exercise.history} />
          )}

          {/* Sets Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Sets</h4>
            <div className="space-y-1">
              {exercise.sets.map((set) => (
                <SetInput
                  key={`${set.setType}-${set.setIndex}`}
                  set={set}
                  onChange={onSetChange}
                />
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <NotesInput value={exercise.notes} onChange={onNotesChange} />

          {/* Rest Timer */}
          {exercise.restTime > 0 && <Timer restTimeSeconds={exercise.restTime} />}
        </div>
      )}
    </div>
  );
}

