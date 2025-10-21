/**
 * View Models for frontend components
 * These types transform API DTOs into component-friendly structures
 */

/**
 * ViewModel for a single plan item in the list view
 * Transformed from WorkoutPlanListItemDto
 */
export interface PlanListItemVM {
  id: string;
  planName: string;
  createdAt: Date;
}

/**
 * ViewModel for paginated plans response
 * Transformed from WorkoutPlanListDto
 */
export interface PaginatedPlansVM {
  items: PlanListItemVM[];
  total: number;
}
