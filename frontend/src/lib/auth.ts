/**
 * Auth API Service
 * Handles authentication-related API calls
 */

import { apiPost } from "./api";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  OAuthRequest,
  OAuthResponse,
} from "../types/auth";

/**
 * Register a new user
 * POST /auth/register
 */
export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>("/auth/register", data);
}

/**
 * Login an existing user
 * POST /auth/login
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", data);
}

/**
 * OAuth login/registration
 * POST /auth/oauth/:provider
 */
export async function oauthLogin(
  provider: "google" | "apple",
  data: OAuthRequest
): Promise<OAuthResponse> {
  return apiPost<OAuthResponse>(`/auth/oauth/${provider}`, data);
}

/**
 * Logout user
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  return apiPost<void>("/auth/logout");
}
