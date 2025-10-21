/**
 * HeaderBar Component
 * Page header with title and optional action button
 */

import { ActionButton } from './ActionButton';

interface HeaderBarProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HeaderBar({ title, actionLabel, onAction }: HeaderBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actionLabel && onAction && (
          <ActionButton label={actionLabel} onClick={onAction} variant="primary" />
        )}
      </div>
    </header>
  );
}

