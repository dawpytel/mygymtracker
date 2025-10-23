/**
 * TechniqueDescription Component
 * Displays intensity technique description with expand/collapse
 */

import { useState } from "react";

interface TechniqueDescriptionProps {
  technique: string;
}

// AI-generated descriptions for intensity techniques
const TECHNIQUE_DESCRIPTIONS: Record<string, string> = {
  drop_set:
    "Drop sets involve performing an exercise to failure, then immediately reducing the weight and continuing for more reps. This increases muscle fatigue and metabolic stress.",
  pause:
    "Pause reps involve holding the weight at a specific point (usually the hardest part) for 1-3 seconds before completing the rep. This eliminates momentum and increases time under tension.",
  partial_length:
    "Partial length reps involve performing the exercise through a limited range of motion, typically focusing on the strongest portion. This allows for heavier loads and targeted muscle activation.",
  fail: "Training to failure means performing reps until you physically cannot complete another with proper form. This maximizes muscle fiber recruitment and stimulation.",
  superset:
    "Supersets involve performing two exercises back-to-back without rest. This increases workout density, cardiovascular demand, and can enhance muscle pump.",
  "N/A": "No specific intensity technique applied. Perform sets as standard working sets.",
};

export function TechniqueDescription({ technique }: TechniqueDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const description =
    TECHNIQUE_DESCRIPTIONS[technique] ||
    "No description available for this technique.";

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium text-blue-900">
          Technique: {technique.replace(/_/g, " ").toUpperCase()}
        </span>
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform ${
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
        <p className="mt-2 text-sm text-blue-800 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

