/**
 * useAuth Hook
 * Manages authentication state and token persistence
 */

import { useState, useCallback } from "react";
import { oauthLogin as apiOauthLogin } from "../lib/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_STORAGE_KEY = "auth_tokens";

/**
 * Load tokens from localStorage
 */
function loadTokensFromStorage(): Pick<
  AuthState,
  "accessToken" | "refreshToken"
> {
  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
      };
    }
  } catch (error) {
    console.error("[useAuth] Failed to load tokens from storage:", error);
  }
  return { accessToken: null, refreshToken: null };
}

/**
 * Save tokens to localStorage
 */
function saveTokensToStorage(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken })
    );
  } catch (error) {
    console.error("[useAuth] Failed to save tokens to storage:", error);
  }
}

/**
 * Clear tokens from localStorage
 */
function clearTokensFromStorage(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("[useAuth] Failed to clear tokens from storage:", error);
  }
}

/**
 * Custom hook for authentication management
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const tokens = loadTokensFromStorage();
    return {
      ...tokens,
      isAuthenticated: !!tokens.accessToken,
      isLoading: false, // localStorage is synchronous, no need for loading state
    };
  });

  /**
   * Set authentication tokens and persist them
   */
  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    saveTokensToStorage(accessToken, refreshToken);
    setAuthState({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  /**
   * Clear authentication tokens
   */
  const clearTokens = useCallback(() => {
    clearTokensFromStorage();
    setAuthState({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  /**
   * Get Authorization header value
   */
  const getAuthHeader = useCallback((): string | null => {
    if (authState.accessToken) {
      return `Bearer ${authState.accessToken}`;
    }
    return null;
  }, [authState.accessToken]);

  const oauthLogin = useCallback(
    async (provider: string, token: string) => {
      setAuthState((state) => ({ ...state, isLoading: true }));
      try {
        const response = await apiOauthLogin(provider, token);
        setTokens(response.accessToken, response.refreshToken);
      } finally {
        setAuthState((state) => ({ ...state, isLoading: false }));
      }
    },
    [setTokens]
  );

  return {
    ...authState,
    setTokens,
    clearTokens,
    getAuthHeader,
    oauthLogin,
  };
}
