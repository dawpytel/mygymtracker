# View Implementation Plan: Create Plan View

## 1. Overview

The Create Plan View allows users to define a new workout plan by entering a plan name and adding one or more exercises with detailed parameters. It ensures inline validation, dynamic form arrays, and accessible autocomplete for selecting exercises.

## 2. View Routing

- Path: `/plans/new`
- Component: `PlanCreatePage` (renders the form)

## 3. Component Structure

```
PlanCreatePage
└── PlanForm
     ├── PlanNameInput
     ├── ExerciseAutocomplete
     ├── ExerciseList
     │     └── ExerciseParameters (one per exercise)
     ├── FormValidationErrors
     └── SaveButton
```

## 4. Component Details

### PlanCreatePage

- Description: Top-level page component for route `/plans/new`.
- Renders: `<PlanForm />`
- Props: none

### PlanForm

- Description: Manages form state, validation, and submission.
- Main elements:
  - Text input for plan name
  - `<ExerciseAutocomplete onSelect={addExercise}/>`
  - `<ExerciseList exercises={exercises} onChange={updateExercise} onRemove={removeExercise}/>`
  - `<FormValidationErrors errors={formErrors}/>`
  - `<SaveButton onClick={handleSubmit} disabled={isSubmitting}/>`
- Handled events:
  - `onPlanNameChange` (update state, validate length ≤100)
  - `onSelectExercise` (append to exercises[], set display_order)
  - `onFieldChange` for each nested field
  - `onRemoveExercise`
  - `onSubmit`
- Validation conditions:
  - planName: required, length 1–100
  - at least one exercise
  - each exercise parameter:
    - exercise_id: required
    - warmup_sets ≥0
    - working_sets 0–4
    - target_reps ≥1
    - rpe_early & rpe_last between 1–10
    - rest_time ≥0
    - notes ≤500 chars
- Types:
  - `PlanExerciseViewModel`
  - `CreateWorkoutPlanDto`
- Props: none

### ExerciseAutocomplete

- Description: Autocomplete search for predefined exercises.
- Main elements: input[type=text], dropdown list (role="listbox")
- Props:
  - `onSelect(exercise: ExerciseDto)`
- Handled events:
  - `onInputChange` (fetchSuggestions)
  - `onSuggestionClick` (call onSelect)
- Validation: none (selection required when adding)
- Types:
  - `ExerciseDto` (id, name)

### ExerciseList

- Description: Renders a list of exercises with parameter forms.
- Props:
  - `exercises: PlanExerciseViewModel[]`
  - `onChange(index: number, updated: PlanExerciseViewModel)`
  - `onRemove(index: number)`
- Renders `<ExerciseParameters />` for each entry

### ExerciseParameters

- Description: Form group for one exercise’s parameters.
- Main elements: labels & inputs/selects for each field, delete button
- Props:
  - `exercise: PlanExerciseViewModel`
  - `index: number`
  - `onChange(updated: PlanExerciseViewModel)`
  - `onRemove()`
- Handled events:
  - `onChange` for each input (call onChange)
  - `onRemoveClick`
- Validation conditions: same as above
- Types:
  - `PlanExerciseViewModel`

### FormValidationErrors

- Description: Displays a list of form-level or field-level validation errors.
- Props:
  - `errors: string[]`
- Renders `<ul role="alert">` with messages

### SaveButton

- Description: Triggers form submission.
- Props:
  - `onClick: () => void`
  - `disabled: boolean`
- Element: `<button type="button">Save Plan</button>`

## 5. Types

```ts
// from API types
interface ExerciseDto {
  id: string;
  name: string;
}
interface PlanExerciseInputDto {
  exercise_id: string;
  display_order: number;
  intensity_technique: IntensityTechnique;
  warmup_sets: number;
  working_sets: number;
  target_reps: number;
  rpe_early: number;
  rpe_last: number;
  rest_time: number;
  notes: string;
}
interface CreateWorkoutPlanDto {
  plan_name: string;
  exercises: PlanExerciseInputDto[];
}

// view models
interface PlanExerciseViewModel extends PlanExerciseInputDto {
  name: string; // Exercise name for display
}
```

## 6. State Management

- Managed in `PlanForm` via React `useState` or `useReducer`.
- State vars:
  - `planName: string`
  - `exercises: PlanExerciseViewModel[]`
  - `formErrors: string[]`
  - `isSubmitting: boolean`
- Consider a `usePlanForm` hook to encapsulate logic: addExercise, updateExercise, removeExercise, validate, handleSubmit.

## 7. API Integration

- Fetch exercise suggestions: `GET /exercises?search=${query}&limit=10` → `ExerciseListDto`
- Submit new plan: `POST /plans` with body `CreateWorkoutPlanDto` → response `WorkoutPlanDto`
- On success: redirect to `/plans`

## 8. User Interactions

1. Enter plan name → inline validate length
2. Click in autocomplete input → fetch suggestions, navigate list via keyboard
3. Select suggestion → exercise added to list, display default parameter values
4. Fill parameter fields → inline validation (numeric ranges)
5. Click remove → remove entry, reindex display_order
6. Click Save → run validation, show errors in `FormValidationErrors` or call API
7. On API success → navigate to list view

## 9. Conditions and Validation

- Plan name: non-empty, ≤100 chars → disable Save if invalid
- Exercises: length ≥1 → disable Save if none
- Nested fields: validate onBlur or onSubmit, collect errors
- API-level validation enforced by backend; reflect messages in UI

## 10. Error Handling

- Validation errors: collect in `formErrors`, display via `FormValidationErrors`
- Network errors (suggestions): show inline message in `ExerciseAutocomplete`
- Submission errors: display error banner above form

## 11. Implementation Steps

1. Create route entry `/plans/new` in router, render `PlanCreatePage`
2. Scaffold `PlanCreatePage.tsx` with `<PlanForm />`
3. Implement `PlanForm` state and handlers (usePlanForm hook)
4. Build `PlanNameInput` with Tailwind styling and validation
5. Build `ExerciseAutocomplete` with debounced fetch, keyboard support, ARIA
6. Build `ExerciseList` and `ExerciseParameters` with fields and delete
7. Implement `FormValidationErrors` and integrate into `PlanForm`
8. Add `SaveButton`, handle submission and redirection
9. Define and export necessary types in `src/types/view.ts`
10. Style components with Tailwind, ensure responsive layout
11. Test manually: add exercises, invalid inputs, monitor validations
12. Write unit tests for form logic and key components
