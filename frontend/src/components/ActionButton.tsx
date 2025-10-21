/**
 * ActionButton Component
 * Reusable button component with consistent styling
 */

import type { ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export function ActionButton({
  label,
  variant = "primary",
  disabled,
  ...props
}: ActionButtonProps) {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:hover:bg-blue-600",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:hover:bg-gray-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:hover:bg-red-600",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      disabled={disabled}
      {...props}
    >
      {label}
    </button>
  );
}
