/**
 * Custom hook for managing workout sessions
 * Handles fetching, filtering, and pagination of workout sessions
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { apiGet } from "../lib/api";
import type {
  WorkoutSessionListDto,
  SessionQueryDto,
  FilterStatus,
  SessionCardViewModel,
} from "../types/sessions";

interface UseSessionsState {
  items: SessionCardViewModel[];
  total: number;
  offset: number;
  loading: boolean;
  error: string | null;
}

interface UseSessionsReturn extends UseSessionsState {
  fetchSessions: (newOffset: number) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Transform API DTO to ViewModel
 */
function transformToViewModel(
  dto: WorkoutSessionListDto
): SessionCardViewModel[] {
  return dto.items.map((item) => ({
    id: item.id,
    status: item.status,
    startedAt: new Date(item.started_at),
    completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
  }));
}

/**
 * Hook for managing workout sessions data
 * @param status - Filter by session status
 * @param limit - Number of items per page
 */
export function useSessions(
  status: FilterStatus = "all",
  limit: number = 20
): UseSessionsReturn {
  const [state, setState] = useState<UseSessionsState>({
    items: [],
    total: 0,
    offset: 0,
    loading: false,
    error: null,
  });

  // Use ref to track current offset to avoid stale closure issues
  const offsetRef = useRef(0);

  /**
   * Fetch sessions from API with given offset
   */
  const fetchSessions = useCallback(
    async (newOffset: number) => {
      if (newOffset < 0) {
        return;
      }

      // Update ref to track current offset
      offsetRef.current = newOffset;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const queryParams: SessionQueryDto = {
          limit,
          offset: newOffset,
          ...(status !== "all" && { status }),
        };

        const queryString = new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, value]) => value !== undefined)
            .reduce(
              (acc, [key, value]) => ({
                ...acc,
                [key]: String(value),
              }),
              {}
            )
        ).toString();

        const response = await apiGet<WorkoutSessionListDto>(
          `/sessions?${queryString}`
        );
        const items = transformToViewModel(response);

        setState({
          items,
          total: response.total,
          offset: newOffset,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch sessions";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [limit, status]
  );

  /**
   * Refetch current page
   */
  const refetch = useCallback(async () => {
    await fetchSessions(offsetRef.current);
  }, [fetchSessions]);

  // Fetch initial data on mount or when status changes
  useEffect(() => {
    fetchSessions(0);
  }, [fetchSessions]);

  return {
    ...state,
    fetchSessions,
    refetch,
  };
}

