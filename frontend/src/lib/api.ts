/**
 * API Client
 * Handles HTTP requests to the backend API
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  statusText: string;
  details?: unknown;

  constructor(
    status: number,
    statusText: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }
}

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.accessToken || null;
    }
  } catch (error) {
    console.error("[API] Failed to get auth token:", error);
  }
  return null;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token and add to headers if available
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add existing headers if any
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers[key] = value;
      }
    });
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    console.log(`[API] ${options?.method || "GET"} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Include credentials for CORS
    });

    console.log(
      `[API] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      // Try to parse error details from response body
      let errorDetails;
      let errorMessage = `API request failed: ${response.statusText}`;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorDetails = await response.json();

          // Extract message from common error response formats
          if (errorDetails && typeof errorDetails === "object") {
            const details = errorDetails as Record<string, unknown>;

            // NestJS validation error format
            if (Array.isArray(details.message)) {
              errorMessage = `Validation errors: ${details.message.join(", ")}`;
            } else if (typeof details.message === "string") {
              errorMessage = details.message;
            } else if (typeof details.error === "string") {
              errorMessage = details.error;
            }
          }
        }
      } catch (parseError) {
        console.error("[API] Failed to parse error response:", parseError);
      }

      console.error(`[API] Error: ${errorMessage}`, errorDetails);
      throw new ApiError(
        response.status,
        response.statusText,
        errorMessage,
        errorDetails
      );
    }

    // Handle 204 No Content or empty response
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return undefined as T;
    }

    // Check if response has content before parsing
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return undefined as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error("[API] Network error:", error);
    throw new Error(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}

export async function oauthLogin(
  provider: string,
  token: string
): Promise<{ accessToken: string; refreshToken: string }> {
  return apiPost(`/auth/oauth/${provider}`, { token });
}
