/**
 * API Types - mirrors backend DTOs
 * These types represent the shape of data from the API
 */

/**
 * Query parameters for workout plan listing
 */
export interface WorkoutPlanQueryDto {
  limit?: number;
  offset?: number;
}

/**
 * Single workout plan item from list endpoint
 */
export interface WorkoutPlanListItemDto {
  id: string;
  plan_name: string;
  created_at: string; // ISO date string from API
}

/**
 * Paginated response for workout plan list
 */
export interface WorkoutPlanListDto {
  items: WorkoutPlanListItemDto[];
  total: number;
}
