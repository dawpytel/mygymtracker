/**
 * EmptyState Component
 * Displayed when user has no workout plans
 */

import { ActionButton } from './ActionButton';

interface EmptyStateProps {
  message: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-label="No plans found"
    >
      <div className="mb-6">
        <svg
          className="w-24 h-24 text-gray-300 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{message}</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Get started by creating your first workout plan
      </p>
      <ActionButton label={ctaLabel} onClick={onCta} variant="primary" />
    </div>
  );
}

