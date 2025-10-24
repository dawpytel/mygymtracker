/**
 * WarmupPanel Component
 * Displays intelligent warmup set recommendations
 */

import type { WarmupSetSuggestion } from "../../types/sessions";

interface WarmupPanelProps {
  suggestions: WarmupSetSuggestion[];
}

export function WarmupPanel({ suggestions }: WarmupPanelProps) {
  // Don't render if no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Recommended Warmup Sets
          </h4>
          <p className="text-xs text-blue-700 mb-3">
            Based on your recent working loads, here are suggested warmup sets to prepare safely:
          </p>
          <div className="space-y-1.5">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-700">
                  Warmup Set {index + 1}
                </span>
                <span className="font-semibold text-gray-900">
                  {suggestion.load.toFixed(1)} kg × {suggestion.reps} reps
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {suggestion.percentage}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-3 italic">
            💡 These are suggestions - feel free to adjust based on how you feel today.
          </p>
        </div>
      </div>
    </div>
  );
}

