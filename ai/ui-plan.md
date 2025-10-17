# UI Architecture for MyWorkout

## 1. UI Structure Overview

MyWorkout is a single-page application built with React and React Router. It uses a header navigation with guarded routes for authenticated users. Unauthenticated users access `/login` and `/register`. Authenticated views include Plan Management, Workout Sessions, Workout History, and User Profile. Data fetching and caching are managed by React Query. Form validation uses React Hook Form with Zod schemas mirroring server-side DTO constraints. Global components handle loading, error states, and accessibility concerns.

## 2. View List

### 2.1 Authentication Views

- **Register View**

  - Path: `/register`
  - Purpose: Allow new users to create accounts (US-001)
  - Key Information: Email, password fields; validation feedback; OAuth buttons (Google, Apple)
  - Components: `AuthForm`, `OAuthButtons`, `FieldError` hints
  - Considerations: Email format checks; password strength meter; ARIA labels; secure HTTPS; CSRF protection

- **Login View**
  - Path: `/login`
  - Purpose: Authenticate existing users (US-002, US-003, US-004)
  - Key Information: Email, password inputs; OAuth sign-in options; error messages on invalid credentials
  - Components: `AuthForm`, `OAuthButtons`, `ToastNotification`
  - Considerations: Prevent brute force; rate-limiting UI feedback; focus management; secure cookie storage

### 2.2 Plan Management

- **Plan List View**

  - Path: `/plans`
  - Purpose: Display all workout plans and entry points for create/edit/delete (US-006)
  - Key Information: List of plan cards with names, creation date; "Create new plan" CTA; empty state message
  - Components: `PlanCard`, `EmptyState`, `ActionButton`
  - Considerations: Keyboard navigable list; confirm before delete; pagination support

- **Plan Create View**

  - Path: `/plans/new`
  - Purpose: Define a new workout plan (US-007, US-008)
  - Key Information: Plan name input; exercise search/autocomplete; parameters form for each exercise; add/delete exercise controls; save button
  - Components: `PlanForm`, `ExerciseAutocomplete`, `ExerciseParameters`, `FormValidationErrors`
  - Considerations: Inline validation (max length, required fields); dynamic form arrays; ARIA roles for list items

- **Plan Edit View**
  - Path: `/plans/:id`
  - Purpose: Modify or delete an existing plan (US-009, US-010, US-011, US-012)
  - Key Information: Pre-filled plan name and exercises; edit/delete controls for each exercise; rename plan; save and delete plan actions
  - Components: `PlanForm`, `ConfirmModal`, `DeleteButton`
  - Considerations: Guard against deleting plans with active sessions; confirm delete; early return on invalid form

### 2.3 Workout Sessions

- **Session List View**

  - Path: `/sessions`
  - Purpose: Show in-progress and completed sessions with filters (US-013)
  - Key Information: Tabs or filter toggles (in-progress, completed, all); session cards with status, start date; CTA to start new session
  - Components: `SessionCard`, `FilterTabs`, `ActionButton`
  - Considerations: Clear status indicators; empty state CTAs; keyboard and screen-reader friendly tabs

- **Session Create View (Plan Selection)**

  - Path: `/sessions/new`
  - Purpose: Choose a plan to start a new workout (US-013)
  - Key Information: List of plans (name, preview); select and start buttons
  - Components: reuse `PlanCard`, `ActionButton`
  - Considerations: Confirm overwriting existing in-progress session; mobile-first layout

- **Session Detail View (Logging)**
  - Path: `/sessions/:id`
  - Purpose: Log sets, reps, and load for each exercise (US-014, US-015)
  - Key Information: Exercise list accordion with AI technique description, recent history, input fields for warm-up and working sets, notes field; rest timers
  - Components: `ExerciseAccordion`, `TechniqueDescription`, `HistoryPanel`, `SetInput`, `Timer`, `SaveButton`, `CancelButton`
  - Considerations: Confirm on unsaved leave (US-017); manual save confirmation; numeric input constraints; focus management; error toasts

### 2.4 Workout History

- **History List View**

  - Path: `/history`
  - Purpose: Browse past workout sessions (US-018)
  - Key Information: Chronological list with date and plan name; empty state CTA
  - Components: `HistoryCard`, `EmptyState`
  - Considerations: Lazy loading; accessible date formatting; delete/edit CTA patterns

- **History Detail View**
  - Path: `/history/:id`
  - Purpose: View, edit, or delete a completed session (US-019, US-020, US-021)
  - Key Information: Full session details (sets, reps, load, notes); edit toggles; delete session button with confirmation
  - Components: `SessionDetail`, `EditableField`, `ConfirmModal`
  - Considerations: Role-based guards; confirm destructive actions; inline editing validation

### 2.5 Profile View

- **Profile View**
  - Path: `/profile`
  - Purpose: Display user email, last login, creation date; logout control (US-005)
  - Key Information: Profile data; logout button
  - Components: `ProfileCard`, `LogoutButton`
  - Considerations: Clear logout confirmation; token clearing; redirect to `/login`

## 3. User Journey Map

1. Unauthenticated user lands on `/` → redirected to `/login`
2. New user navigates to `/register`, completes registration (US-001) → auto-login → redirected to `/plans`
3. User creates a plan via `/plans/new` (US-007, US-008) → saved → returns to `/plans`
4. User selects "Start Workout" in `/plans` → redirected to `/sessions/new` → chooses plan → POST `/sessions` → redirected to `/sessions/:id`
5. User logs sets in `/sessions/:id` (US-014, US-015) → clicks "Save Workout" → PATCH `/sessions/:id` status to completed → navigates to `/history`
6. User views history in `/history` (US-018) → selects entry → `/history/:id` (US-019) → optionally edits or deletes (US-020, US-021)
7. User logs out via profile dropdown → `/login`

## 4. Layout and Navigation Structure

- **Header Navigation**: Brand logo (home), links: Plans, Workout, History, Profile
- **Side Drawer (mobile)**: Collapsible menu with same links
- **Route Guards**: Protect `/plans`, `/sessions`, `/history`, `/profile`; redirect unauthenticated users to `/login`
- **Breadcrumbs**: On nested views (`/plans/:id`, `/sessions/:id`, `/history/:id`)

## 5. Key Components

- **AuthForm**: Shared login/register form handling inputs, validation, OAuth
- **PlanForm**: Dynamic form array for plan exercises with inline validation
- **ExerciseAccordion**: Accordion containing technique, history, and input fields
- **SessionWizard**: Manages step flow for session creation and logging
- **ConfirmModal**: Reusable confirmation dialog for destructive actions
- **EmptyState**: Standardized empty-state component with message and CTA
- **ToastNotification**: Global notification for errors and successes
- **FilterTabs**: Accessible tab component for filtering lists by status
- **EditableField**: Inline editing wrapper with validation and save callback

---

_This UI Architecture ensures all PRD requirements are met, aligns with the API plan, and incorporates UX, accessibility, and security best practices._
