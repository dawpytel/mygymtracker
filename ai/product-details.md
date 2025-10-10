# Product Requirements Document - MyWorkout MVP

## Product Overview

MyWorkout is a web-based workout tracking application designed for experienced fitness enthusiasts who can program their own workouts and need a simple, effective way to track their training progress.

### Target Users

- **Primary segments**: Powerlifters and bodybuilders
- **User characteristics**: Knowledgeable about workout programming, self-directed, need tracking rather than guidance
- **Target metric**: 100 active users within first 3 months

## Core Features & Functionality

### 1. User Account System

- **Authentication**: Email/password with OAuth options (Google/Apple)
- **Profile data**: Email, account creation date, last login timestamp
- **No username required**: Display email for user identification

### 2. Plan Mode - Workout Plan Creation

- **Plan structure**:

  - Plan name (required, max 100 characters)
  - Unlimited exercises per plan
  - Unlimited plans per user
  - Plans remain as reusable templates

- **Exercise configuration per plan**:
  - Exercise name (from pre-populated list)
  - Intensity technique (dropdown: drop sets, pause, lengthened partials, failure, superset, N/A)
  - Number of warm-up sets (required, numeric)
  - Number of working sets (required, numeric, max 4 sets)
  - Target reps per set (required, numeric)
  - Early set RPE (required, 1-10 scale)
  - Last set RPE (required, 1-10 scale)
  - Rest time in seconds (required, numeric)
  - Notes field (optional, max 500 characters)

### 3. Train Mode - Workout Execution

- **Workout logging interface**:

  - Select workout plan from list
  - Exercises displayed in plan order (but completable in any sequence)
  - For each exercise, display:
    - Exercise name with auto-expanded AI exercise description (collapsible)
    - Read-only RPE targets and rest time from plan
    - Last 3-5 historical instances (collapsible view)
    - Separate sections for warm-up and working sets
    - Input fields for actual reps and load (kg, decimal allowed to 1 place)
    - Single notes field per exercise

- **Workout completion**:
  - Manual save with completion confirmation
  - No auto-save functionality
  - Allows partial workout saves (not all exercises required)
  - No data persistence if not saved

### 4. Workout History

- **Display format**: Chronological list showing date and workout plan name
- **Details view**: Full workout data when clicking on history item
- **Edit/Delete**: Users can modify or remove any historical workout

### 5. AI Exercise Descriptions

- **Implementation**:
  - Automatic display when exercise selected
  - Recognition by exercise name
  - Proactive form cues without user input
  - Local caching for frequent exercises
  - Limited API calls for new/rare exercises

## Technical Specifications

### Database Structure (Supabase)

1. **users table**: Authentication and profile data
2. **workout_plans table**: JSON field for exercise configurations
3. **completed_workouts table**: JSON field for actual performance data

### Frontend Requirements

- **Responsive design**: Mobile-browser optimized
- **Browser support**: Latest 2 versions of major browsers
- **No offline functionality**: Internet connection required
- **Framework**: Web-based application (technology TBD by developer)

### Data Validation

- **Numeric fields**: Reps, warm-up sets, working sets, load (with inline error messages)
- **Required fields**: Plan name, at least one exercise per plan
- **Character limits**: 100 chars for plan names, 500 chars for notes
- **Load values**: Decimal to 1 place, kilograms only

### Exercise Database

- **Pre-populated**: 100-150 common powerlifting and bodybuilding exercises
- **Autocomplete**: Exercise name search functionality
- **Custom exercises**: Not supported in MVP

## User Workflows

### Creating a Workout Plan

1. Navigate to Plan Mode
2. Click "Create new workout plan"
3. Enter plan name
4. Add exercises with all required parameters
5. Save plan (minimum 1 exercise required)

### Executing a Workout

1. Navigate to Train Mode
2. Select workout plan from list
3. View exercise with AI description and historical data
4. Log sets, reps, and weights for each exercise
5. Complete exercises in any order
6. Click completion confirmation to save entire workout

### Viewing History

1. Navigate to workout history
2. View chronological list of completed workouts
3. Click any workout to see full details
4. Option to edit or delete with confirmation modal

## UI/UX Requirements

- **Empty states**: Friendly messages with CTA buttons
- **Delete confirmations**: Modal dialogs for all destructive actions
- **Error handling**: Inline validation messages
- **Visual hierarchy**: Clear separation between warm-up and working sets
- **Two distinct modes**: Visual distinction between Plan and Train modes

## Out of Scope for MVP

- Mobile applications (native iOS/Android)
- Workout duplication/copying features
- Progress visualization/analytics
- Volume calculations
- Offline/PWA functionality
- Custom exercise creation
- User feedback system
- Automatic workout saving
- Unit conversion (pounds)
- Weekly/monthly workout planning
- Social features
- Payment/subscription system

## Development Timeline

- **Duration**: 1 month
- **Team**: Solo developer
- **Priority order**:
  1. Core workout logging and plan creation
  2. AI exercise descriptions
  3. OAuth authentication

## Success Metrics

- 100 active users in 3 months
- Users successfully creating and executing workout plans
- System stability with no data loss on saves

## Support

- Contact email in application footer
- No formal feedback gathering system
- No in-app support features

## Monetization

- Completely free for MVP phase
- Future monetization strategy TBD based on user adoption
