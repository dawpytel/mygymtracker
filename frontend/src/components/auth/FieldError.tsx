/**
 * FieldError Component
 * Displays inline field-specific error messages
 */

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="text-sm text-red-600 mt-1"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

