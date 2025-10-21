/**
 * LoadingIndicator Component
 * Displays a loading spinner with optional message
 */

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({
  message = 'Loading...',
}: LoadingIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
}

