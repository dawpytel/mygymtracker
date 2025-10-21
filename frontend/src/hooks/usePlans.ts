/**
 * Custom hook for managing workout plans
 * Handles fetching, pagination, and deletion of workout plans
 */

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiDelete } from '../lib/api';
import type { WorkoutPlanListDto, WorkoutPlanQueryDto } from '../types/api';
import type { PaginatedPlansVM, PlanListItemVM } from '../types/viewModels';

interface UsePlansState {
  items: PlanListItemVM[];
  total: number;
  offset: number;
  loading: boolean;
  error: string | null;
}

interface UsePlansReturn extends UsePlansState {
  fetchPlans: (newOffset: number) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Transform API DTO to ViewModel
 */
function transformToViewModel(dto: WorkoutPlanListDto): PaginatedPlansVM {
  return {
    items: dto.items.map((item) => ({
      id: item.id,
      planName: item.plan_name,
      createdAt: new Date(item.created_at),
    })),
    total: dto.total,
  };
}

/**
 * Hook for managing workout plans data and operations
 * @param limit - Number of items per page
 */
export function usePlans(limit: number = 20): UsePlansReturn {
  const [state, setState] = useState<UsePlansState>({
    items: [],
    total: 0,
    offset: 0,
    loading: false,
    error: null,
  });

  /**
   * Fetch plans from API with given offset
   */
  const fetchPlans = useCallback(
    async (newOffset: number) => {
      if (newOffset < 0) {
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const queryParams: WorkoutPlanQueryDto = {
          limit,
          offset: newOffset,
        };

        const queryString = new URLSearchParams(
          Object.entries(queryParams).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: String(value),
            }),
            {}
          )
        ).toString();

        const response = await apiGet<WorkoutPlanListDto>(
          `/plans?${queryString}`
        );
        const viewModel = transformToViewModel(response);

        setState({
          items: viewModel.items,
          total: viewModel.total,
          offset: newOffset,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch plans';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [limit]
  );

  /**
   * Delete a plan by ID and refetch the current page
   */
  const deletePlan = useCallback(
    async (id: string) => {
      try {
        await apiDelete(`/plans/${id}`);
        // Refetch current page after deletion
        await fetchPlans(state.offset);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete plan';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        throw error; // Re-throw to allow caller to handle
      }
    },
    [fetchPlans, state.offset]
  );

  /**
   * Refetch current page
   */
  const refetch = useCallback(async () => {
    await fetchPlans(state.offset);
  }, [fetchPlans, state.offset]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchPlans(0);
  }, [fetchPlans]);

  return {
    ...state,
    fetchPlans,
    deletePlan,
    refetch,
  };
}

