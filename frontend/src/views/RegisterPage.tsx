/**
 * RegisterPage View
 * User registration page
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthForm } from "../components/auth/AuthForm";
import { OAuthButtons } from "../components/auth/OAuthButtons";
import { ToastNotification } from "../components/ToastNotification";
import { useAuthContext } from "../contexts/AuthContext";
import { register } from "../lib/auth";
import { ApiError } from "../lib/api";
import type { AuthFormValues, AuthErrorMap } from "../types/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const [isLoading, setIsLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<AuthErrorMap | undefined>();
  const [toastMessage, setToastMessage] = useState<string | undefined>();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: AuthFormValues) => {
    // Clear previous errors
    setServerErrors(undefined);
    setToastMessage(undefined);
    setIsLoading(true);

    try {
      // Call register API
      const response = await register({
        email: values.email,
        password: values.password,
      });

      console.log("[RegisterPage] Registration successful:", response);

      // Show success toast
      setToastMessage("Account created successfully! Please log in.");

      // Redirect to login page after short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("[RegisterPage] Registration failed:", error);

      if (error instanceof ApiError) {
        // Handle specific error codes
        if (error.status === 400) {
          // Validation errors
          const details = error.details as Record<string, unknown>;
          if (details && Array.isArray(details.message)) {
            setToastMessage(`Validation errors: ${details.message.join(", ")}`);
          } else {
            setToastMessage(error.message);
          }
        } else if (error.status === 409) {
          // Email already exists
          setServerErrors({
            email: "Email already registered. Please log in instead.",
          });
        } else {
          // Other API errors
          setToastMessage(error.message);
        }
      } else if (error instanceof Error) {
        // Network errors
        setToastMessage(
          "Network error. Please check your connection and try again."
        );
      } else {
        // Unknown errors
        setToastMessage("An unexpected error occurred. Please try again.");
      }

      setIsLoading(false);
    }
  };

  /**
   * Dismiss toast notification
   */
  const handleDismissToast = () => {
    setToastMessage(undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start tracking your workouts today
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <AuthForm
            mode="register"
            onSubmit={handleSubmit}
            serverErrors={serverErrors}
            isLoading={isLoading}
          />

          {/* OAuth Buttons */}
          <div className="mt-6">
            <OAuthButtons isLoading={isLoading} />
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          type={toastMessage.includes("success") ? "success" : "error"}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  );
}
