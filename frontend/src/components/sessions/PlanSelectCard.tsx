/**
 * PlanSelectCard Component
 * Displays a workout plan with a "Start" action for session creation
 */

import { format } from "date-fns";
import type { PlanListItemVM } from "../../types/viewModels";

interface PlanSelectCardProps {
  plan: PlanListItemVM;
  onStart: (planId: string) => void;
}

export function PlanSelectCard({ plan, onStart }: PlanSelectCardProps) {
  const formattedDate = format(plan.createdAt, "MMM d, yyyy");

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {plan.planName}
          </h3>
          <time
            dateTime={plan.createdAt.toISOString()}
            className="text-sm text-gray-600 mt-1 block"
          >
            Created {formattedDate}
          </time>
        </div>
        <div className="ml-4">
          <button
            onClick={() => onStart(plan.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Start workout with ${plan.planName}`}
          >
            Start
          </button>
        </div>
      </div>
    </article>
  );
}

