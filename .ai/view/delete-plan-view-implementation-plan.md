# View Implementation Plan: Delete Workout Plan

## 1. Overview

Allow users to delete an entire workout plan from both the plan list and the plan edit page. Deletion requires a confirmation modal and, upon success, removes the plan from the list or redirects back to the list.

## 2. View Routing

- Plan List View: `/plans` (already exists)
- Plan Edit View: `/plans/:id/edit` (already exists)

## 3. Component Structure

- PlanListPage
  - HeaderBar
  - PlanCard (one per plan)
  - ConfirmDialog
  - PaginationControls
- PlanEditPage
  - HeaderBar
  - PlanForm
  - ConfirmDialog
  - ErrorBanner (for deletion errors)

## 4. Component Details

### PlanListPage (existing)

- Purpose: Display and manage list of plans.
- Main elements: `<HeaderBar>`, list of `<PlanCard>`s, `<ConfirmDialog>`.
- Handled events:
  - `onDelete` from `PlanCard` → open confirm modal.
  - Confirm → call `deletePlan(id)` from `usePlans`.
- Validation: none.
- Types:
  - PlanListItemVM (id, planName, createdAt)
- Props: none.

### PlanEditPage (enhancement)

- Purpose: Edit a plan and provide a delete option.
- Main elements:
  - `<HeaderBar>` (title only)
  - `<PlanForm>` (create/edit form)
  - **Delete Button**: red “Delete Plan” button next to Cancel/Save or in header actions.
  - `<ConfirmDialog>` (reuse existing)
  - `<ErrorBanner>` (show deletion errors)
- Handled events:
  - `onClick` Delete button → `openDeleteConfirm()`
  - `onCancel` modal → `closeDeleteConfirm()`
  - `onConfirm` modal → `handleConfirmDelete()`
- Validation:
  - Must have `id` from route params.
- Types:
  - None new; reuse PlanExerciseVM and WorkoutPlanDto.
- Props: none.

### ConfirmDialog (existing)

- Purpose: Generic modal for confirmations.
- Props:
  - `isOpen: boolean`
  - `title: string`
  - `message: string`
  - `confirmLabel: string`
  - `cancelLabel: string`
  - `onConfirm: () => void`
  - `onCancel: () => void`
- Behavior: disables confirm during loading.

## 5. Types

No new DTOs. Frontend view models:

- PlanListItemVM (already defined)
- PlanExerciseVM (already defined)
- No additional type definitions needed for deletion (response is void / 204).

## 6. State Management

**PlanListPage** (already):

- `selectedPlan: PlanListItemVM | null`
- `isConfirmOpen: boolean`
- `isDeleting: boolean`

**PlanEditPage** (new):

- `isDeleteConfirmOpen: boolean` – tracks modal visibility.
- `isDeleting: boolean` – tracks deletion in progress.
- `deleteError: string | null` – holds deletion error message.

Consider a small custom hook `useDeletePlan(id: string)` that returns `{ isDeleting, error, deletePlan: () => Promise<void> }` using `apiDelete`.

## 7. API Integration

- Method: `DELETE /plans/:id`
- Request: no body
- Response: 204 No Content
- Frontend:
  - In `usePlans`: `apiDelete('/plans/${id}')` (existing).
  - In `PlanEditPage`: call `apiDelete(`/plans/${id}`)`.
- On success:
  - List: re-fetch plans.
  - Edit: navigate to `/plans`.

## 8. User Interactions

1. **PlanListPage**
   - User clicks delete icon/button on a plan card.
   - Confirmation modal opens.
   - User confirms → spinner on “Delete” button.
   - API call → on success close modal and update list.
2. **PlanEditPage**
   - User clicks “Delete Plan” button.
   - Confirmation modal opens.
   - User confirms → spinner on “Delete” button.
   - API call → on success navigate back to `/plans`.
   - On error show `<ErrorBanner>` above form.

## 9. Conditions and Validation

- **Route param**: `id` must be present and valid UUID. If missing, show error and no delete button.
- **ConfirmDialog**: confirm button disabled when `isDeleting` is true.
- **ErrorBanner**: shown only if `deleteError` is non-null.

## 10. Error Handling

- Wrap API call in `try/catch`.
- On error:
  - In list: `usePlans` sets `error` and the `<ErrorBanner>` appears above list.
  - In edit: set `deleteError`; render `<ErrorBanner message={deleteError} />` in page.
- Allow retry by re-opening modal or retry button in banner.

## 11. Implementation Steps

1. **PlanListPage**: Verify delete flow already works; no changes needed.
2. **PlanEditPage**:
   1. Import `apiDelete` from `../lib/api` and `ConfirmDialog`, `ErrorBanner`, `useNavigate`, `useParams`.
   2. Add state hooks: `isDeleteConfirmOpen`, `isDeleting`, `deleteError`.
   3. Add “Delete Plan” button:
      - Place below header or in header bar actions.
      - Style: red text/button.
      - On click → `setIsDeleteConfirmOpen(true)`.
   4. Render `<ConfirmDialog>`:
      - Props bound to new state.
      - Title: “Delete Plan”
      - Message: `Are you sure you want to delete “${initialData.planName}”? This action cannot be undone.`
      - confirmLabel: `isDeleting ? "Deleting..." : "Delete"`
      - onConfirm → `handleConfirmDelete`
      - onCancel → `setIsDeleteConfirmOpen(false)`
   5. Implement `handleConfirmDelete`:
      - Guard: if no `id`, return.
      - `setIsDeleting(true); setDeleteError(null);`
      - Try `await apiDelete(`/plans/${id}`)`.
      - On success: navigate to `/plans`.
      - On error: set `deleteError(error.message || ...)`; keep modal open.
      - Finally: `setIsDeleting(false)`.
   6. In JSX above `<PlanForm>`, conditionally render `<ErrorBanner>` if `deleteError`.
3. **Testing**:
   - Verify delete button appears.
   - Confirm modal text and labels.
   - Successful deletion removes plan (list) or redirects (edit).
   - API errors surface via banner and modal remains open.
4. **Styling & Accessibility**:
   - Ensure “Delete Plan” button has `aria-label`.
   - ConfirmDialog uses `aria-describedby`.
   - Buttons keyboard- and screen-reader-friendly.
5. **Documentation**:
   - Update README or component docs to note new delete flow on edit page.
