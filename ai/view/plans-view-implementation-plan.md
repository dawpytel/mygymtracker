# View Implementation Plan: Plan List View

## 1. Overview

The Plan List View displays all user-created workout plans in a paginated, keyboard-accessible list. Users can view plan names and creation dates, navigate to create or edit pages, and delete plans with confirmation. An empty state guides users to create their first plan.

## 2. View Routing

- Path: `/plans`
- Route component mounts `PlanListPage`.

## 3. Component Structure

```
PlanListPage
├── HeaderBar (title + Create button)
├── LoadingIndicator (conditional)
├── EmptyState (conditional)
├── PlanList (ul)
│    └── PlanCard[] (li)
├── PaginationControls
└── ConfirmDialog (portal, conditional)
```

## 4. Component Details

### PlanListPage

- Description: Container for fetching data, handling state, and orchestrating child components.
- Elements & Components:
  - `HeaderBar`: displays page title and "Create New Plan" action.
  - `LoadingIndicator`: shown while API call in progress.
  - `EmptyState`: shown when no plans.
  - `PlanList`: wraps `PlanCard` items.
  - `PaginationControls`: navigation for pages.
  - `ConfirmDialog`: modal for delete confirmation.
- Handled Events:
  - `onCreate()`: navigate to `/plans/create`.
  - `onEdit(id)`: navigate to `/plans/${id}/edit`.
  - `onDeleteClick(item)`: open confirm dialog.
  - `onConfirmDelete()`: call delete API, refresh list.
  - `onPageChange(newOffset)`: fetch with updated offset.
- Validation:
  - Show correct component based on `loading`, `items.length`.
  - Pagination bounds: offset ≥ 0, offset < total.
- Types:
  - Request DTO: `{ limit: number; offset: number }`
  - Response DTO: `WorkoutPlanListDto` (items: `WorkoutPlanListItemDto[]`, total: number)
  - ViewModel: `PaginatedPlansVM` (items: `PlanListItemVM[]`, total: number)
- Props: none (page-level)

### PlanCard

- Description: Displays a single plan’s name, created date, and action buttons.
- Elements:
  - `<h3>` for plan name
  - `<time>` for formatted creation date
  - `<button>` Edit
  - `<button>` Delete
- Handled Events:
  - `onEdit(id)`
  - `onDelete(item)`
- Validation:
  - `planName` non-empty
  - `createdAt` valid date
- Types:
  - Props: `item: PlanListItemVM`, `onEdit: (id:string)=>void`, `onDelete:(item)=>void`

### EmptyState

- Description: Shown when user has no plans.
- Elements:
  - Message text: "No plans"
  - `ActionButton` for "Create New Plan"
- Handled Events:
  - `onCreate()`
- Props: `message: string`, `ctaLabel: string`, `onCta: ()=>void`

### ActionButton

- Description: Reusable button component with consistent styling.
- Elements: `<button>` with Tailwind classes.
- Props: `label: string`, `onClick: ()=>void`, `disabled?: boolean`

### PaginationControls

- Description: Controls for navigating pages.
- Elements:
  - `<button>` Prev
  - `<span>` Page info
  - `<button>` Next
- Handled Events:
  - `onPageChange(newOffset)`
- Validation:
  - Disable Prev if offset===0
  - Disable Next if offset+limit ≥ total
- Props: `limit: number`, `offset: number`, `total: number`, `onPageChange: (newOffset:number)=>void`

### ConfirmDialog

- Description: Modal to confirm deletion.
- Elements:
  - `<p>` Confirmation text
  - `<button>` Confirm
  - `<button>` Cancel
- Handled Events:
  - `onConfirm()`
  - `onCancel()`
- Props: `isOpen: boolean`, `title: string`, `message: string`, `onConfirm:()=>void`, `onCancel:()=>void`

## 5. Types

- WorkoutPlanListItemDto (from API):
  - `id: string`
  - `plan_name: string`
  - `created_at: string`
- PlanListItemVM:
  - `id: string`
  - `planName: string`
  - `createdAt: Date`
- PaginatedPlansVM:
  - `items: PlanListItemVM[]`
  - `total: number`

## 6. State Management

- Custom hook `usePlans(limit: number)`:
  - State: `items`, `total`, `offset`, `loading`, `error`
  - Methods: `fetchPlans(offset)`, `deletePlan(id)`
- Local state in `PlanListPage`:
  - `selectedPlan`: PlanListItemVM|null
  - `isConfirmOpen`: boolean

## 7. API Integration

- GET /plans?limit={limit}&offset={offset}
  - Request type: `WorkbookPlanQueryDto`
  - Response: `WorkoutPlanListDto`
  - Map response items to `PlanListItemVM` via `createdAt = new Date(item.created_at)`
- DELETE /plans/:id
  - Request: none
  - Response: HTTP 204
  - On success: refetch plans

## 8. User Interactions

1. Page load → `fetchPlans(0)` → show `LoadingIndicator` → render list or `EmptyState`.
2. Click "Create New Plan" → navigate to `/plans/create`.
3. Click Edit on PlanCard → navigate to `/plans/{id}/edit`.
4. Click Delete → open `ConfirmDialog` → Confirm → call API → close dialog → refetch → update list.
5. Click Prev/Next → call `fetchPlans` with new offset.
6. Keyboard navigation: Tab through cards and buttons; Enter to activate.

## 9. Conditions and Validation

- `items.length === 0` → show `EmptyState`.
- `loading` true → show `LoadingIndicator`.
- Pagination: Prev disabled if `offset===0`; Next disabled if `offset + limit >= total`.

## 10. Error Handling

- Fetch error → banner at top with retry button invoking `fetchPlans(offset)`.
- Delete error → toast notification with retry.
- Unexpected errors → log to console and show user-friendly message.

## 11. Implementation Steps

1. Create `usePlans` hook in `src/hooks/usePlans.ts`.
2. Define `PlanListItemVM` and `PaginatedPlansVM` in `src/types/viewModels.ts`.
3. Scaffold `PlanListPage` in `src/views/PlanListPage.tsx` with routing.
4. Implement `HeaderBar` and integrate Create button.
5. Implement `PlanCard` component with edit/delete callbacks.
6. Implement `EmptyState` component reusing `ActionButton`.
7. Implement `PaginationControls` component and integrate with hook.
8. Implement `ConfirmDialog` component and integrate state in page.
9. Integrate API calls in `usePlans`, handle loading and errors.
10. Format dates with `date-fns`.
11. Add Tailwind styling to all components.
12. Write unit tests for hook and components (Jest + React Testing Library).
13. Ensure accessibility: aria-labels, focus trap in modal.

---

_End of Plan_
