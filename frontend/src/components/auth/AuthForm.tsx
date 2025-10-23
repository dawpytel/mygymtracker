/**
 * AuthForm Component
 * Reusable form for email/password input
 */

import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { FieldError } from "./FieldError";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import type { AuthFormValues, AuthErrorMap } from "../../types/auth";

interface AuthFormProps {
  mode: "register" | "login";
  onSubmit: (values: AuthFormValues) => void;
  serverErrors?: AuthErrorMap;
  isLoading?: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Invalid email format";
  }
  return undefined;
}

/**
 * Validate password based on mode
 */
function validatePassword(password: string, mode: "register" | "login"): string | undefined {
  if (!password) {
    return "Password is required";
  }
  if (mode === "register" && password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return undefined;
}

export function AuthForm({ mode, onSubmit, serverErrors, isLoading = false }: AuthFormProps) {
  const [values, setValues] = useState<AuthFormValues>({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState<Record<keyof AuthFormValues, boolean>>({
    email: false,
    password: false,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * Handle input change
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    setValidationErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  /**
   * Handle input blur - validate field
   */
  const handleBlur = (field: keyof AuthFormValues) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validate the field
    let error: string | undefined;
    if (field === "email") {
      error = validateEmail(values.email);
    } else if (field === "password") {
      error = validatePassword(values.password, mode);
    }

    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(values.email);
    const passwordError = validatePassword(values.password, mode);

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Set validation errors
    setValidationErrors({
      email: emailError,
      password: passwordError,
    });

    // If any validation errors, don't submit
    if (emailError || passwordError) {
      return;
    }

    // Submit form
    onSubmit(values);
  };

  // Combine client and server errors
  const emailError = touched.email ? (validationErrors.email || serverErrors?.email) : undefined;
  const passwordError = touched.password ? (validationErrors.password || serverErrors?.password) : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => handleBlur("email")}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            emailError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
          placeholder="Enter your email"
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && <FieldError message={emailError} />}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={() => handleBlur("password")}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            passwordError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
          placeholder={mode === "register" ? "Create a password (min. 8 characters)" : "Enter your password"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError && <FieldError message={passwordError} />}
        {mode === "register" && <PasswordStrengthMeter password={values.password} />}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {mode === "register" ? "Creating account..." : "Signing in..."}
          </span>
        ) : (
          <span>{mode === "register" ? "Create account" : "Sign in"}</span>
        )}
      </button>
    </form>
  );
}

