# Product Requirements Document (PRD) - MyWorkout

## 1. Product Overview

MyWorkout is a web-based workout tracking application designed for experienced fitness enthusiasts who program their own workouts and need a simple yet effective tool to monitor their progress. The application focuses on delivering core functionality without unnecessary features often found in beginner-oriented apps. The MVP (Minimum Viable Product) aims to provide key functionalities such as creating workout plans, logging completed workouts, viewing history, and intelligent exercise technique suggestions powered by AI.

The target audience includes individuals such as powerlifters and bodybuilders who have knowledge of training programming and need a tool for tracking, not guidance.

## 2. User Problem

Most workout tracking applications available on the market are designed for people who don't know what their training plan should look like, offering ready-made templates and advice. However, experienced users who can independently create training plans only need a simple and efficient way to track their sessions and progress. Current solutions are too complex, feature-heavy, and unnecessarily restrictive for them. MyWorkout solves this problem by providing a minimalist tool focused solely on tracking training data.

## 3. Functional Requirements

### 3.1. User Account System

- Authentication via email and password.
- Optional authentication through OAuth providers (Google, Apple).
- User profile stores email, account creation date, and last login date.
- Email address is used for user identification; username is not required.

### 3.2. Plan Mode - Creating Workout Plans

- Users can create, edit, and delete workout plans.
- Each user can have unlimited plans.
- Each plan can contain unlimited exercises.
- Plans function as reusable templates.
- Each exercise in a plan must have defined:
  - Exercise name (selected from a predefined list).
  - Intensity technique (drop set, pause, partial length, fail, superset, N/A).
  - Number of warm-up sets (required, numeric).
  - Number of working sets (required, numeric, max 4).
  - Target reps per set (required, numeric).
  - RPE for early sets (required, scale 1-10).
  - RPE for last set (required, scale 1-10).
  - Rest time in seconds (required, numeric).
  - Optional notes (max 500 characters).

### 3.3. Workout Mode - Executing Workouts

- User selects a workout plan from the list to start a session.
- Exercises are displayed in plan order but can be performed in any sequence.
- For each exercise, the interface displays:
  - Exercise name with automatically expanded (but collapsible) AI-generated technique description.
  - Target RPE values and rest time (read-only).
  - History of 3-5 most recent results for that exercise (collapsible view).
  - Input fields for actual reps and load (in kg, with precision to one decimal place).
- Workout saving is manual; no auto-save feature.
- Partially completed workouts can be saved.

### 3.4. Workout History

- Completed workouts are displayed in a chronological list (date and plan name).
- Clicking on a history entry displays full details of that workout.
- User can edit or delete any saved workout.

### 3.5. Exercise Database and AI Descriptions

- Application contains a predefined list of 100-150 popular strength exercises.
- Search with autocomplete makes it easy to find exercises.
- MVP does not support adding custom exercises.
- AI-generated technique descriptions are displayed automatically when an exercise is selected.

### 3.6. Data Validation

- Numeric fields (reps, sets, load) must accept only appropriate values.
- Plan name and adding at least one exercise are required to save a plan.
- Character limits apply: 100 for plan name, 500 for notes.

## 4. Product Boundaries

The following features are not in scope for the MVP:

- Native mobile applications (iOS/Android).
- Plan copy/duplicate functionality.
- Progress visualizations and analytics.
- Training volume calculations.
- Offline functionality (PWA).
- User-created custom exercises.
- User feedback collection system.
- Automatic workout saving.
- Unit conversion (e.g., to pounds).
- Weekly/monthly workout scheduling.
- Social features.
- Payment/subscription system.

## 5. User Stories

### Authentication

- **ID:** US-001
- **Title:** User registration with email and password
- **Description:** As a new user, I want to register an account using my email address and password so that I can access the application and save my data.
- **Acceptance Criteria:**

  1. Registration form contains fields for email address and password.
  2. Email format validation exists.
  3. Password must meet minimum security requirements (e.g., length).
  4. System checks if email is not already registered.
  5. After successful registration, user is automatically logged in and redirected to the main application dashboard.

- **ID:** US-002
- **Title:** User login with email and password
- **Description:** As a registered user, I want to log in to my account using email and password so that I can continue tracking my workouts.
- **Acceptance Criteria:**

  1. Login form contains fields for email address and password.
  2. When incorrect credentials are provided, an appropriate message is displayed.
  3. After successful login, user is redirected to the main application dashboard.

- **ID:** US-003
- **Title:** Login with Google account
- **Description:** As a user, I want to be able to log in using my Google account to make the login process faster and more convenient.
- **Acceptance Criteria:**

  1. Login page contains a "Sign in with Google" button.
  2. After clicking, user is redirected to standard Google authentication process.
  3. After successful authentication, user is logged into MyWorkout application.
  4. If this is the first login with that Google account, a new user account is created in the system.

- **ID:** US-004
- **Title:** Login with Apple account
- **Description:** As a user, I want to be able to log in using my Apple account to make the login process faster and more convenient.
- **Acceptance Criteria:**

  1. Login page contains a "Sign in with Apple" button.
  2. After clicking, user is redirected to standard Apple authentication process.
  3. After successful authentication, user is logged into MyWorkout application.
  4. If this is the first login with that Apple account, a new user account is created in the system.

- **ID:** US-005
- **Title:** Logout from application
- **Description:** As a logged-in user, I want to be able to log out of my account to secure my data on shared devices.
- **Acceptance Criteria:**
  1. A "Logout" button is available in the user interface.
  2. After clicking the button, user session is terminated and user is redirected to the login page.

### Workout Plan Management

- **ID:** US-006
- **Title:** Viewing list of workout plans
- **Description:** As a user, I want to see a list of all my workout plans so that I can easily manage them or select one to start a workout.
- **Acceptance Criteria:**

  1. After navigating to "Plan Mode", a list of all plans created by the user is displayed.
  2. If user has no plans, a "No plans" message is displayed along with a "Create new plan" call-to-action button.

- **ID:** US-007
- **Title:** Creating a new workout plan
- **Description:** As a user, I want to be able to create a new workout plan so that I can define the structure of my future workouts.
- **Acceptance Criteria:**

  1. In "Plan Mode" there is a "Create new plan" button.
  2. After clicking, user can enter a plan name.
  3. Plan name is required and cannot exceed 100 characters.
  4. Plan must contain at least one exercise to be saved.
  5. After saving, the new plan appears in the plan list.

- **ID:** US-008
- **Title:** Adding exercise to workout plan
- **Description:** As a user, while creating or editing a plan, I want to be able to add exercises to build a complete workout plan.
- **Acceptance Criteria:**

  1. In the plan form there is an "Add exercise" option.
  2. User can search for an exercise from a predefined list (autocomplete).
  3. After selecting an exercise, fields appear to define parameters: intensity technique, warm-up/working sets, reps, RPE, rest time, notes.
  4. All required fields must be filled.
  5. User can add multiple exercises to one plan.

- **ID:** US-009
- **Title:** Editing exercise in workout plan
- **Description:** As a user, I want to be able to edit exercise parameters in an existing plan to adapt it to my current goals.
- **Acceptance Criteria:**

  1. Each exercise on the plan list has an "Edit" option.
  2. After selecting it, user can modify all previously defined exercise parameters.
  3. Changes are saved after confirming plan edit.

- **ID:** US-010
- **Title:** Deleting exercise from workout plan
- **Description:** As a user, I want to be able to delete an exercise from a plan if I determine it is no longer needed.
- **Acceptance Criteria:**

  1. Each exercise on the plan list has a "Delete" option.
  2. After clicking, user is asked to confirm the operation in a modal window.
  3. After confirmation, the exercise is permanently removed from the plan.

- **ID:** US-011
- **Title:** Renaming workout plan
- **Description:** As a user, I want to be able to change the name of an existing workout plan so that it better reflects its content.
- **Acceptance Criteria:**

  1. In plan edit view, the name field is editable.
  2. Plan name must remain non-empty and not exceed 100 characters.
  3. After saving the plan, the new name is visible in the plan list.

- **ID:** US-012
- **Title:** Deleting workout plan
- **Description:** As a user, I want to be able to delete an entire workout plan when I no longer need it.
- **Acceptance Criteria:**
  1. In the plan list or plan edit view there is a "Delete plan" option.
  2. User must confirm the desire to delete the plan in a modal window.
  3. After confirmation, the plan is permanently deleted and disappears from the list.

### Workout Execution

- **ID:** US-013
- **Title:** Starting workout session
- **Description:** As a user, I want to start a workout session based on one of my plans so that I can record my results.
- **Acceptance Criteria:**

  1. In "Workout Mode", a list of my workout plans is displayed.
  2. After selecting a plan, the application transitions to the workout logging interface.
  3. A list of exercises from the selected plan is displayed.

- **ID:** US-014
- **Title:** Viewing exercise details during workout
- **Description:** As a user, while performing an exercise, I want to see its details such as technique description and results history to train effectively and safely.
- **Acceptance Criteria:**

  1. For each exercise on the list, AI technique description automatically expands (with ability to collapse).
  2. Read-only data from the plan is displayed: target RPE and rest time.
  3. A collapsible section showing results (load, reps) from the 3-5 most recent sessions for that exercise is available.

- **ID:** US-015
- **Title:** Logging data for exercise sets
- **Description:** As a user, I want to be able to enter the number of reps and load used for each completed set (warm-up and working) to precisely track my workout.
- **Acceptance Criteria:**

  1. Interface contains separate sections for warm-up and working sets, according to the plan.
  2. For each set, fields are available to enter actual reps and load (in kg).
  3. Load field accepts decimal values with precision to one decimal place.
  4. One notes field is available for each exercise.

- **ID:** US-016
- **Title:** Saving completed workout session
- **Description:** As a user, after finishing a workout, I want to be able to save the entire session so that it is added to my history.
- **Acceptance Criteria:**

  1. In the workout interface there is a "Save workout" button.
  2. User is asked to confirm the save.
  3. It is possible to save a workout even if not all exercises were completed.
  4. After saving, user is informed of success and the session appears in workout history.

- **ID:** US-017
- **Title:** Canceling workout session without saving
- **Description:** As a user, I want to be able to abandon an ongoing workout session without saving data if I decide not to finish it.
- **Acceptance Criteria:**
  1. User can leave the workout view at any time.
  2. If any data was entered in the session, a warning about losing unsaved changes appears when attempting to leave the view.
  3. If user confirms the desire to leave, data from the current session is not saved.

### Workout History

- **ID:** US-018
- **Title:** Viewing workout history
- **Description:** As a user, I want to have access to a chronological list of all my saved workouts so that I can analyze my history.
- **Acceptance Criteria:**

  1. In the dedicated "History" section, a list of completed workouts is displayed, sorted from newest.
  2. Each entry on the list shows at least the date and workout plan name.
  3. If history is empty, an appropriate message and CTA are displayed.

- **ID:** US-019
- **Title:** Displaying historical workout details
- **Description:** As a user, I want to be able to see full details of a specific past workout to thoroughly analyze what I did then.
- **Acceptance Criteria:**

  1. Clicking on an entry in workout history redirects to detailed view.
  2. Detailed view shows all exercises performed during that session, along with saved data (sets, reps, load, notes).

- **ID:** US-020
- **Title:** Editing saved workout in history
- **Description:** As a user, I want to be able to edit data in a saved workout in case I made an error during data entry.
- **Acceptance Criteria:**

  1. In the historical workout detail view there is an "Edit" option.
  2. It allows modification of all entered data (reps, load, notes).
  3. After saving changes, they are permanently updated in history.

- **ID:** US-021
- **Title:** Deleting workout from history
- **Description:** As a user, I want to be able to delete a workout from my history if it was saved by mistake or for other reasons.
- **Acceptance Criteria:**
  1. In the detail view or on the history list there is a "Delete" option.
  2. User must confirm the desire to delete the entry in a modal window.
  3. After confirmation, the workout is permanently removed from history.

## 6. Success Metrics

- Achieve 100 active users within the first 3 months of launch.
- High rate of successful workout plan creation and execution by users.
- Ensure system stability with no instances of data loss during workout saves.
