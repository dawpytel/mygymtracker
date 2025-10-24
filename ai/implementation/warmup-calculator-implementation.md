# Warmup Set Calculator - Implementation Summary

## Overview

The Warmup Set Calculator is a business logic feature that automatically generates intelligent warmup set recommendations for exercises during workout sessions. It calculates warmup loads and reps based on historical working loads, following progressive loading patterns commonly used in strength training.

## Implementation Details

### 1. PRD Updates (`ai/prd.md`)

**Updated Section 3.3 - Workout Mode:**

- Added "Intelligent warmup set recommendations based on historical working loads (read-only suggestions)" to the exercise display list

**New User Story US-022:**

- **Title:** Automatic warmup set recommendations
- **Description:** Users receive intelligent warmup set suggestions based on historical working loads to efficiently prepare for working sets without manual calculation
- **Acceptance Criteria:**
  - Automatic calculation and display during workout sessions
  - Based on most recent working load from history
  - Default progressive warmup scheme when no history exists
  - Display format: "load (kg) × reps" for each set
  - Progressive loading pattern (e.g., 50%, 60%, 70% of working weight)
  - Number of warmup sets matches plan configuration
  - Read-only recommendations (users can log different values)

### 2. Core Service (`backend/src/common/warmup/warmup.service.ts`)

**Key Features:**

- Configurable warmup percentages and rep schemes
- Default configuration: 40%, 50%, 60%, 70%, 80% of working load
- Default reps: 8, 6, 5, 3, 2 (descending as load increases)
- Smart rounding to practical weight increments (2.5kg for loads ≥20kg, 1.25kg for lighter loads)
- Fallback to default working load (60kg) when no history exists

**Main Methods:**

- `calculateWarmupSets(workingLoad, numberOfWarmupSets)` - Calculate warmup sets from a known working load
- `calculateFromHistory(recentWorkingLoads, numberOfWarmupSets)` - Calculate using most recent historical working load
- Smart selection of highest intensity warmup sets when requesting fewer than available

**Configuration:**

```typescript
interface WarmupConfig {
  loadPercentages: number[]; // e.g., [0.4, 0.5, 0.6, 0.7, 0.8]
  repsPerSet: number[]; // e.g., [8, 6, 5, 3, 2]
  defaultWorkingLoad: number; // e.g., 60kg
}
```

### 3. Type Definitions (`backend/src/types.ts`)

**New Interface:**

```typescript
interface WarmupSetSuggestion {
  load: number; // Recommended load in kg
  reps: number; // Recommended repetitions
  percentage: number; // Percentage of working load
}
```

**Updated DTO:**

- `SessionExerciseDetailDto` now includes `warmup_suggestions: WarmupSetSuggestion[]`
- Full OpenAPI documentation for frontend integration

### 4. Sessions Service Integration (`backend/src/sessions/sessions.service.ts`)

**Changes:**

- Injected `WarmupService` into `SessionsService`
- Added `calculateWarmupSuggestions()` private method
- Updated `findOne()` to include warmup suggestions in exercise details
- Graceful error handling - returns empty array on failure rather than breaking the request

**Integration Flow:**

1. User requests workout session details
2. Service fetches exercise history (last 5 sessions)
3. Service calls `calculateWarmupSuggestions()` with history and warmup set count
4. Warmup suggestions included in `SessionExerciseDetailDto` response
5. Frontend displays warmup recommendations

### 5. Module Configuration (`backend/src/sessions/sessions.module.ts`)

- Added `WarmupService` to providers array
- Available for dependency injection in `SessionsService`

## Example Scenarios

### Scenario 1: User with History

**Context:**

- Exercise: Bench Press
- Recent working load: 100kg
- Plan specifies: 3 warmup sets

**Calculated Warmup Suggestions:**

1. 60kg × 5 reps (60% of 100kg)
2. 70kg × 3 reps (70% of 100kg)
3. 80kg × 2 reps (80% of 100kg)

### Scenario 2: New Exercise (No History)

**Context:**

- Exercise: Squat
- No previous sessions
- Plan specifies: 2 warmup sets

**Calculated Warmup Suggestions:**

1. 42.5kg × 3 reps (70% of default 60kg)
2. 47.5kg × 2 reps (80% of default 60kg)

### Scenario 3: Many Warmup Sets

**Context:**

- Exercise: Deadlift
- Recent working load: 140kg
- Plan specifies: 5 warmup sets

**Calculated Warmup Suggestions:**

1. 55kg × 8 reps (40% of 140kg)
2. 70kg × 6 reps (50% of 140kg)
3. 85kg × 5 reps (60% of 140kg)
4. 97.5kg × 3 reps (70% of 140kg)
5. 112.5kg × 2 reps (80% of 140kg)

## Business Logic Highlights

### Progressive Loading Pattern

- Lower percentages for early warmup sets (40-50%)
- Higher percentages for later sets (70-80%)
- Gradually prepares muscles and nervous system for working loads

### Descending Rep Scheme

- More reps at lighter loads (8 reps at 40%)
- Fewer reps at heavier loads (2 reps at 80%)
- Minimizes fatigue while ensuring adequate preparation

### Smart Weight Rounding

- Rounds to 2.5kg increments for typical weights (≥20kg)
- Uses 1.25kg increments for light weights (<20kg)
- Matches standard barbell plate increments

### Historical Intelligence

- Uses most recent working load as reference
- Ignores older session data for recency bias
- Adapts to user's current strength level automatically

## Testing

### Unit Tests (`backend/src/common/warmup/warmup.service.spec.ts`)

- **25 test cases** covering:
  - Basic warmup calculation
  - History-based calculation
  - Edge cases (null values, empty history, extreme loads)
  - Progressive loading validation
  - Custom configuration support
  - Realistic workout scenarios

### Test Results

```
Test Suites: 1 passed
Tests:       25 passed
Time:        0.361s
```

## API Response Example

```json
{
  "id": "session-exercise-uuid",
  "exercise_name": "Bench Press",
  "warmup_sets": 3,
  "warmup_suggestions": [
    {
      "load": 60.0,
      "reps": 5,
      "percentage": 60
    },
    {
      "load": 70.0,
      "reps": 3,
      "percentage": 70
    },
    {
      "load": 80.0,
      "reps": 2,
      "percentage": 80
    }
  ],
  "history": [
    {
      "date": "2025-10-20T10:00:00Z",
      "reps": 8,
      "load": 100.0
    }
  ],
  "sets": []
}
```

## Frontend Integration Guide

### Display Format

For each warmup suggestion:

```
Warmup Set 1: 60 kg × 5 reps (60% of working load)
Warmup Set 2: 70 kg × 3 reps (70% of working load)
Warmup Set 3: 80 kg × 2 reps (80% of working load)
```

### UI Recommendations

1. Display warmup suggestions prominently above working sets section
2. Use read-only/informational styling (not editable fields)
3. Show all suggestions even if user hasn't started warmup
4. Allow users to log different actual values if they choose

## Configuration & Extensibility

### Customizing Warmup Patterns

The warmup configuration can be customized per instance:

```typescript
// Example: More conservative warmup for beginners
const beginnerConfig = {
  loadPercentages: [0.3, 0.4, 0.5, 0.6],
  repsPerSet: [10, 8, 6, 4],
  defaultWorkingLoad: 40,
};

const warmupService = new WarmupService(beginnerConfig);
```

### Future Enhancements

- Exercise-specific warmup patterns (squat vs. bench press)
- User-configurable warmup preferences
- Dynamic adjustment based on training phase
- Integration with RPE data for fatigue management
- Warmup suggestions for other set types (drop sets, supersets)

## Benefits

### For Users

- **Time Saving:** No manual warmup calculation needed
- **Consistency:** Follows proven progressive loading patterns
- **Safety:** Ensures proper warmup before heavy loads
- **Personalization:** Adapts to individual strength levels automatically

### For Development

- **Separation of Concerns:** Business logic isolated in dedicated service
- **Testability:** Pure functions with comprehensive test coverage
- **Configurability:** Easy to adjust warmup patterns
- **Maintainability:** Clean, documented code following best practices

## Files Modified/Created

### Created

- `backend/src/common/warmup/warmup.service.ts` - Core warmup calculation service
- `backend/src/common/warmup/warmup.service.spec.ts` - Comprehensive unit tests
- `ai/warmup-calculator-implementation.md` - This documentation

### Modified

- `ai/prd.md` - Added US-022 and updated functional requirements
- `backend/src/types.ts` - Added `WarmupSetSuggestion` interface and updated DTOs
- `backend/src/sessions/sessions.service.ts` - Integrated warmup calculation
- `backend/src/sessions/sessions.module.ts` - Added `WarmupService` provider

## Conclusion

The Warmup Set Calculator successfully implements intelligent, personalized warmup recommendations following industry-standard progressive loading patterns. The implementation is:

✅ **Well-tested** - 25 passing unit tests
✅ **Configurable** - Customizable warmup patterns
✅ **Integrated** - Seamlessly works with existing session flow
✅ **Documented** - PRD updated with clear acceptance criteria
✅ **Production-ready** - Error handling and edge cases covered

The feature provides immediate value to users by automating warmup planning while maintaining flexibility for those who prefer custom approaches.
