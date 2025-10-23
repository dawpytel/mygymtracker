/**
 * HistoryPanel Component
 * Displays recent session history for an exercise
 */

import { useState } from "react";
import type { ExerciseHistoryEntry } from "../../types/sessions";

interface HistoryPanelProps {
  history: ExerciseHistoryEntry[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium text-gray-900">
          Recent History ({history.length})
        </span>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
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
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {history.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm bg-white rounded px-3 py-2"
            >
              <span className="text-gray-600">{formatDate(entry.date)}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-900">
                  {entry.reps} reps × {entry.load} kg
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

