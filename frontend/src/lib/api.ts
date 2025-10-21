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
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

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
      } catch {
        // If parsing fails, use default message
      }

      throw new ApiError(
        response.status,
        response.statusText,
        errorMessage,
        errorDetails
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
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
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}
