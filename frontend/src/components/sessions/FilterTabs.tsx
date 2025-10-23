/**
 * FilterTabs Component
 * Accessible tab group for filtering sessions by status
 */

import type { FilterStatus } from "../../types/sessions";

interface FilterTabsProps {
  currentStatus: FilterStatus;
  onChange: (status: FilterStatus) => void;
}

const FILTER_OPTIONS: Array<{ value: FilterStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function FilterTabs({ currentStatus, onChange }: FilterTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Filter sessions by status"
      className="flex gap-1 border-b border-gray-200"
    >
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={currentStatus === option.value}
          aria-controls="sessions-list"
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 font-medium text-sm transition-colors
            border-b-2 -mb-px
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              currentStatus === option.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}

