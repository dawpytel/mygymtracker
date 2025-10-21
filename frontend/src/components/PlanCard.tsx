/**
 * PlanCard Component
 * Displays a single workout plan with edit and delete actions
 */

import { format } from 'date-fns';
import type { PlanListItemVM } from '../types/viewModels';

interface PlanCardProps {
  item: PlanListItemVM;
  onEdit: (id: string) => void;
  onDelete: (item: PlanListItemVM) => void;
}

export function PlanCard({ item, onEdit, onDelete }: PlanCardProps) {
  const formattedDate = format(item.createdAt, 'MMM d, yyyy');

  return (
    <li className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {item.planName}
          </h3>
          <time
            dateTime={item.createdAt.toISOString()}
            className="text-sm text-gray-600 mt-1 block"
          >
            Created {formattedDate}
          </time>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(item.id)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`Edit ${item.planName}`}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label={`Delete ${item.planName}`}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

