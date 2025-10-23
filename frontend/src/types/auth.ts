/**
 * Auth Types
 * Types for authentication flows
 */

// ============================================================================
// FORM VALUES
// ============================================================================

/**
 * Values passed by AuthForm
 */
export interface AuthFormValues {
  email: string;
  password: string;
}

/**
 * Map of field-specific error messages
 */
export type AuthErrorMap = Partial<Record<keyof AuthFormValues, string>>;

/**
 * OAuth provider types
 */
export type OAuthProvider = "google" | "apple";

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Response from successful registration
 */
export interface RegisterResponse {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Request body for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Request body for OAuth login
 */
export interface OAuthRequest {
  token: string;
}

/**
 * Response from OAuth login
 */
export interface OAuthResponse extends LoginResponse {}

// ============================================================================
// PAGE STATE
// ============================================================================

/**
 * ViewModel for auth pages
 */
export interface AuthPageState {
  loading: boolean;
  serverErrors?: AuthErrorMap;
  toastMessage?: string;
}

/**
 * Toast message types
 */
export type ToastType = "error" | "success";

