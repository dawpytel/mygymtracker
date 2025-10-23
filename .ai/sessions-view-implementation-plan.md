# View Implementation Plan [Sessions View]

## 1. Overview

The Sessions View provides users with three key workflows:

- **Sessions List** (`/sessions`): Display and filter existing workout sessions (in-progress, completed, all) and allow starting a new session.
- **Session Create** (`/sessions/new`): Let users select a workout plan and start a new session, with overwrite confirmation for existing in-progress sessions.
- **Session Detail** (`/sessions/:id`): Log sets, reps, load, notes for each exercise in the session; view AI technique descriptions, recent history, and rest timers; save or cancel the session with appropriate confirmations.

## 2. View Routing

- `/sessions` &rarr; `SessionsPage`
- `/sessions/new` &rarr; `SessionCreatePage`
- `/sessions/:id` &rarr; `SessionDetailPage`

## 3. Component Structure

SessionsPage
├── FilterTabs
├── ActionButton (Start New Session)
└── SessionsList
└── SessionCard (xN)

SessionCreatePage
├── PlansList
│ └── PlanCard (xN)
├── ConfirmOverwriteModal
└── ActionButton (Start Session)

SessionDetailPage
├── ExerciseAccordion (xN)
│ ├── TechniqueDescription
│ ├── HistoryPanel
│ ├── SetsSection
│ │ └── SetInput (xM)
│ ├── NotesInput
│ └── Timer
├── SaveButton
└── CancelButton

## 4. Component Details

### FilterTabs

- Description: Accessible tab group for filtering sessions by status (`in_progress`, `completed`, `all`).
- Elements: `<nav role="tablist">`, `<button role="tab">` items.
- Events: `onSelect(status)` &rarr; updates filter state.
- Validation: None.
- Types:
  - Props: `{ currentStatus: SessionStatus | 'all'; onChange: (status) => void; }`

### SessionCard

- Description: Card showing session ID, status indicator, start date (and completed date if applicable).
- Elements: `<article>`, status badge, dates.
- Events: Click &rarr; navigates to `/sessions/:id`.
- Validation: None.
- Types:
  - ViewModel: `{ id: string; status: SessionStatus; startedAt: string; completedAt?: string; }`
  - Props: `{ session: SessionCardViewModel; }`

### ActionButton

- Description: Primary CTA button for navigation or actions.
- Elements: `<button>`.
- Events: `onClick` (navigate or trigger action).
- Validation: None.
- Props: `{ label: string; onClick: () => void; }`

### PlansList / PlanCard

- Description: List of PlanCard components showing plan name and preview info.
- Props & Types mirror SessionCard.

### ConfirmOverwriteModal

- Description: Modal asking to confirm starting new session if one is in progress.
- Events: Confirm & Cancel.

### ExerciseAccordion

- Description: Accordion per exercise.
- Elements: `<button role="heading">`, `<section role="region">`.
- Events: Toggle expand/collapse.
- Props: `{ exercise: ExerciseAccordionViewModel; }`

### TechniqueDescription

- Description: Displays AI-generated technique text.
- Props: `{ text: string; expanded: boolean; }`

### HistoryPanel

- Description: Collapsible list of recent session results for exercise.
- Props: `{ history: { date: string; reps: number; load: number; }[]; }`

### SetsSection / SetInput

- Description: For each set (warmup/working), input fields.
- Elements: `<input type="number" step="1" min="1">`, `<input type="number" step="0.1" min="0">`.
- Props: `{ sets: SetViewModel[]; onChange: (id, { reps, load }) => void; }`
- Validation: reps ≥1 integer, load ≥0 one decimal.

### NotesInput

- Description: `<textarea maxLength=500>`.
- Validation: maxLength 500.

### Timer

- Description: Rest timer component with start/reset.

### SaveButton / CancelButton

- Description: Buttons triggering save or cancel flows.
- Events: Confirm modals, API calls.

## 5. Types

- SessionCardViewModel: `{ id: string; status: SessionStatus; startedAt: string; completedAt?: string; }`
- FilterStatus = `in_progress` | `completed` | `all`
- CreateSessionReq = `{ plan_id: string; }`
- CreateSessionRes = `{ id: string; status: SessionStatus; started_at: string; }`
- WorkoutSessionDetail =
  ```ts
  interface WorkoutSessionDetail {
    id: string;
    status: SessionStatus;
    started_at: string;
    completed_at?: string;
    exercises: Array<{
      id: string;
      exercise_id: string;
      exercise_name: string;
      target_reps: number;
      rpe_early: number;
      rpe_last: number;
      rest_time: number;
      notes: string;
      history: { date: string; reps: number; load: number }[];
      sets: Array<{
        id: string;
        set_type: SetType;
        set_index: number;
        reps?: number;
        load?: number;
      }>;
    }>;
  }
  ```
- ExerciseAccordionViewModel extends above.

## 6. State Management

- `useSessions(status: FilterStatus)` hook: fetch GET `/sessions?status=...`.
- Local state: `status`, `sessions`, `loading`, `error`.
- `useWorkoutPlans()` for plan list.
- `useSessionDetail(id)` for detail.
- Local detail page state: `formData` for sets and notes, `isDirty` flag, `showConfirm`.
- `useUnsavedChangesPrompt(isDirty)` to block navigation.

## 7. API Integration

- GET `/sessions?status=${status}` → `WorkoutSessionListDto`
- POST `/sessions` with `CreateSessionReq` → `CreateSessionRes`
- GET `/sessions/${id}` → `WorkoutSessionDetail`
- PATCH `/sessions/${id}` with `{ status: 'completed' | 'cancelled' }`
- DELETE `/sessions/${id}` → no content
- GET `/workout-plans?limit&offset` → `WorkoutPlanListDto`

## 8. User Interactions

1. Select filter tab → update status, refetch sessions.
2. Click “Start New Session” → navigate to `/sessions/new`.
3. Click PlanCard’s “Start” → if `isDirty`, show overwrite modal; on confirm POST → navigate to detail.
4. In detail: expand/collapse accordion; input reps/load; edit notes.
5. Click “Save Workout” → if no dirty data, disable save; else confirm modal → PATCH status `completed` → toast success → navigate to `/sessions`.
6. Click “Cancel Workout” → show unsaved prompt → on confirm DELETE → navigate to `/sessions`.

## 9. Conditions and Validation

- FilterTabs: valid statuses only.
- SetInput: reps ≥1 integer, load ≥0 with one decimal; enforce via input props & validation messages.
- NotesInput: <=500 chars.
- SaveButton disabled if no sets entered.
- Overwrite prompt if existing in-progress session detected.

## 10. Error Handling

- API errors (network/500): show error toast with retry.
- Empty states:
  - SessionsPage: “No sessions found” + CTA “Start New Session.”
  - PlansPage: “No plans” + link to “Create Plan.”
- Validation errors: inline messages for invalid reps/load.
- Unsaved data: browser confirm on attempt to leave.

## 11. Implementation Steps

1. Define ViewModel types in `frontend/src/types/sessions.ts`.
2. Create custom hooks: `useSessions`, `useWorkoutPlans`, `useSessionDetail`, `useUnsavedChangesPrompt`.
3. Implement `FilterTabs` and `SessionCard` components with accessibility.
4. Build `SessionsPage` using hooks and components; handle loading and empty states.
5. Implement `SessionCreatePage`: fetch plans, display `PlanCard`, handle start flows and modal.
6. Create `ExerciseAccordion` family of components; ensure responsive/mobile-first.
7. Build `SessionDetailPage`: orchestrate accordion list, form state, timers, save/cancel flows.
8. Add routing in React Router for `/sessions`, `/sessions/new`, `/sessions/:id`.
9. Style with Tailwind; test keyboard and screen-reader accessibility.
10. Write unit tests for hooks and components; add E2E tests for workflows.
