/**
 * ToastNotification Component
 * Display ephemeral messages (e.g., invalid credentials, network errors)
 */

import { useEffect } from "react";

interface ToastNotificationProps {
  message: string;
  type: "error" | "success";
  onDismiss: () => void;
  autoHideDuration?: number;
}

export function ToastNotification({
  message,
  type,
  onDismiss,
  autoHideDuration = 3000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (autoHideDuration) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onDismiss]);

  const bgColor = type === "error" ? "bg-red-600" : "bg-green-600";
  const icon =
    type === "error" ? (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-md animate-slide-in-right"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`${bgColor} text-white rounded-lg shadow-lg p-4 flex items-start gap-3`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

