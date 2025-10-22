# View Implementation Plan Plan Form

## 1. Overview

The Plan Form view enables users to create or edit a workout plan by adding, configuring, and ordering exercises. It supports autocomplete search for exercises, parameter inputs per exercise (intensity technique, sets, reps, RPE, rest, notes), and full validation before saving.

## 2. View Routing

- Create mode: `/plans/create`
- Edit mode: `/plans/:id/edit`

## 3. Component Structure

- **PlanFormPage** (page container)
  - Fetches existing plan (edit) or initializes empty form (create)
  - Renders `PlanForm`
- **PlanForm**
  - State and validation management
  - Renders `PlanHeader`, `ExerciseList`, `AddExerciseButton`, and `SavePlanControls`
- **PlanHeader**
  - Inputs for plan name
- **ExerciseList**
  - Renders list of `ExerciseItem` components
- **ExerciseItem**
  - Displays exercise summary
  - Edit and delete actions
- **ExerciseDialogForm**
  - Modal form to add/edit a single exercise
  - Contains autocomplete input and parameter fields
- **AddExerciseButton**
  - Opens `ExerciseDialogForm` in add mode
- **SavePlanControls**
  - Save and cancel buttons

## 4. Component Details

### PlanFormPage

- Description: Coordinates data load and mode (create/edit)
- Elements: page title, back navigation, `PlanForm`
- Events: mount→fetch, cancel click→navigate back
- Validation: none
- Types: `PlanDto`, `PlanFormData`
- Props: none

### PlanForm

- Description: Manages form state and validation
- Elements: `<form>`, `PlanHeader`, `ExerciseList`, `AddExerciseButton`, `SavePlanControls`
- Events: add/edit exercise, remove exercise, save, cancel
- Validation:
  - Plan name required, max 100 chars
  - At least one exercise
  - Each exercise: required fields per spec
- Types: `PlanFormData`, `ExerciseFormData[]`
- Props:
  - `initialData?: PlanFormData`
  - `onSubmit(data: PlanFormData): Promise<void>`

### PlanHeader

- Description: Input for plan name
- Elements: `<input type="text">`
- Events: onChange
- Validation: non-empty, maxLength 100
- Types: part of `PlanFormData`
- Props: `name: string`, `onNameChange: (v:string)=>void`, `error?: string`

### ExerciseList

- Description: Displays exercises in order
- Elements: map over `exercises` → `ExerciseItem`
- Events: edit click, delete click, reorder
- Validation: none
- Types: `ExerciseFormData[]`
- Props: `exercises`, `onEdit(id)`, `onDelete(id)`

### ExerciseItem

- Description: Summary row for an exercise
- Elements: fields display, Edit and Delete buttons
- Events: onEdit, onDelete
- Validation: none
- Types: `ExerciseFormData`
- Props: `exercise`, `onEdit`, `onDelete`

### ExerciseDialogForm

- Description: Modal for add/edit exercise
- Elements: Autocomplete search, dropdown for intensity, numeric inputs, textarea for notes
- Events: onSelectExercise, onFieldChange, onSave, onCancel
- Validation:
  - Exercise selected
  - warmupSets ≥ 0
  - workingSets between 0-4
  - targetReps ≥1
  - rpe 1-10
  - restTime ≥0
  - notes ≤500 chars
- Types: `ExerciseFormData`
- Props:
  - `initial?: ExerciseFormData`
  - `isOpen: boolean`
  - `onClose()`, `onSave(data)`

### AddExerciseButton

- Description: Trigger to open dialog
- Elements: `<button>Add exercise</button>`
- Events: onClick→open dialog
- Props: `onClick`

### SavePlanControls

- Description: Save/cancel actions
- Elements: `<button>Save</button>`, `<button>Cancel</button>`
- Events: onSave, onCancel
- Props: `onSave`, `onCancel`, `disabled?: boolean`

## 5. Types

```ts
// Plan DTO from API
interface PlanDto {
  id: string;
  plan_name: string;
  exercises: PlanExerciseDto[];
}
// ViewModel for form
interface PlanFormData {
  planName: string;
  exercises: ExerciseFormData[];
}
interface ExerciseFormData {
  id?: string; // existing db id
  exerciseId: string;
  displayOrder: number;
  intensityTechnique: IntensityTechnique;
  warmupSets: number;
  workingSets: number;
  targetReps: number;
  rpeEarly: number;
  rpeLast: number;
  restTime: number;
  notes: string;
}
```

## 6. State Management

- Use `usePlanForm(initialData?)` custom hook:
  - Manages `PlanFormData`
  - Handlers: addExercise, updateExercise, removeExercise, setPlanName
  - Validates data on save

## 7. API Integration

- GET `/plans/:id` → returns `PlanDto` → map to `PlanFormData`
- POST `/plans` (create) or PUT `/plans/:id` (edit) → body: `{ plan_name, exercises: PlanExerciseInputDto[] }`
- On success: navigate to plan list

## 8. User Interactions

1. Load view (create/edit)
2. Enter plan name
3. Click "Add exercise" → open modal
4. Search and select exercise → fill parameters → Save → appears in list
5. Click Edit on item → open modal with data → update → Save
6. Delete item → remove from list
7. Click Save plan → validate → call API → success → redirect

## 9. Conditions and Validation

- Plan name required, ≤100 chars
- Must have ≥1 exercise
- ExerciseFormData fields must satisfy numeric ranges and lengths
- Disable Save button until valid

## 10. Error Handling

- API errors: display toast or inline error
- Validation errors: inline field messages
- Network failure: retry option or alert

## 11. Implementation Steps

1. Create `PlanFormPage` in `src/views/PlanCreatePage.tsx` and `PlanEditPage.tsx`
2. Implement `usePlanForm` hook
3. Build `PlanHeader`, `ExerciseList`, `ExerciseItem`
4. Implement `ExerciseDialogForm` with autocomplete using existing API
5. Add `AddExerciseButton` and `SavePlanControls`
6. Wire up API calls with `api.ts` functions
7. Add form validation and disable save when invalid
8. Style with Tailwind per design
9. Test create and edit flows with mock data
10. Address edge cases and error scenarios
