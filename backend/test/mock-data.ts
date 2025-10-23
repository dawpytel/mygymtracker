/**
 * Mock data for E2E tests
 * Provides consistent test data that follows validation rules
 */

import {
  IntensityTechnique,
  SetType,
  SessionStatus,
} from '../src/types';

/**
 * Test user credentials
 */
export const testUsers = {
  user1: {
    email: 'user1@test.com',
    password: 'password123',
  },
  user2: {
    email: 'user2@test.com',
    password: 'password456',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'password123',
  },
  shortPassword: {
    email: 'user3@test.com',
    password: 'short',
  },
};

/**
 * Test exercises names
 */
export const testExercises = {
  benchPress: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  overheadPress: 'Overhead Press',
  barbellRow: 'Barbell Row',
  pullUp: 'Pull Up',
};

/**
 * Valid plan exercise data
 */
export const validPlanExercise = {
  display_order: 0,
  intensity_technique: IntensityTechnique.DROP_SET,
  warmup_sets: 2,
  working_sets: 3,
  target_reps: 10,
  rpe_early: 7,
  rpe_last: 9,
  rest_time: 120,
  notes: 'Focus on form and full range of motion',
};

/**
 * Valid plan exercise with minimal data
 */
export const minimalPlanExercise = {
  display_order: 0,
  intensity_technique: IntensityTechnique.NA,
  warmup_sets: 0,
  working_sets: 1,
  target_reps: 1,
  rpe_early: 1,
  rpe_last: 1,
  rest_time: 0,
  notes: '',
};

/**
 * Invalid plan exercise - working_sets too high
 */
export const invalidPlanExercise_WorkingSets = {
  display_order: 0,
  intensity_technique: IntensityTechnique.DROP_SET,
  warmup_sets: 2,
  working_sets: 5, // Max is 4
  target_reps: 10,
  rpe_early: 7,
  rpe_last: 9,
  rest_time: 120,
  notes: 'Invalid',
};

/**
 * Invalid plan exercise - RPE out of range
 */
export const invalidPlanExercise_RPE = {
  display_order: 0,
  intensity_technique: IntensityTechnique.DROP_SET,
  warmup_sets: 2,
  working_sets: 3,
  target_reps: 10,
  rpe_early: 11, // Max is 10
  rpe_last: 9,
  rest_time: 120,
  notes: 'Invalid',
};

/**
 * Invalid plan exercise - target_reps too low
 */
export const invalidPlanExercise_Reps = {
  display_order: 0,
  intensity_technique: IntensityTechnique.DROP_SET,
  warmup_sets: 2,
  working_sets: 3,
  target_reps: 0, // Min is 1
  rpe_early: 7,
  rpe_last: 9,
  rest_time: 120,
  notes: 'Invalid',
};

/**
 * Invalid plan exercise - notes too long
 */
export const invalidPlanExercise_NotesTooLong = {
  display_order: 0,
  intensity_technique: IntensityTechnique.DROP_SET,
  warmup_sets: 2,
  working_sets: 3,
  target_reps: 10,
  rpe_early: 7,
  rpe_last: 9,
  rest_time: 120,
  notes: 'x'.repeat(501), // Max is 500
};

/**
 * Valid workout plan
 */
export const validWorkoutPlan = {
  plan_name: 'Push Day',
  exercises: [],
};

/**
 * Valid workout plan with exercises
 */
export function createValidWorkoutPlan(exerciseIds: {
  benchPressId: string;
  squatId: string;
}) {
  return {
    plan_name: 'Full Body Workout',
    exercises: [
      {
        exercise_id: exerciseIds.benchPressId,
        ...validPlanExercise,
        display_order: 0,
      },
      {
        exercise_id: exerciseIds.squatId,
        ...validPlanExercise,
        display_order: 1,
        intensity_technique: IntensityTechnique.PAUSE,
        notes: 'Pause at bottom',
      },
    ],
  };
}

/**
 * Invalid workout plan - plan_name too long
 */
export const invalidWorkoutPlan_NameTooLong = {
  plan_name: 'x'.repeat(101), // Max is 100
  exercises: [],
};

/**
 * Invalid workout plan - empty plan_name
 */
export const invalidWorkoutPlan_EmptyName = {
  plan_name: '',
  exercises: [],
};

/**
 * Valid exercise set
 */
export const validExerciseSet = {
  set_type: SetType.WORKING,
  set_index: 1,
  reps: 10,
  load: 80.5,
};

/**
 * Valid warmup set
 */
export const validWarmupSet = {
  set_type: SetType.WARMUP,
  set_index: 1,
  reps: 10,
  load: 40.0,
};

/**
 * Invalid exercise set - set_index too low
 */
export const invalidExerciseSet_SetIndex = {
  set_type: SetType.WORKING,
  set_index: 0, // Min is 1
  reps: 10,
  load: 80.5,
};

/**
 * Invalid exercise set - reps too low
 */
export const invalidExerciseSet_Reps = {
  set_type: SetType.WORKING,
  set_index: 1,
  reps: 0, // Min is 1
  load: 80.5,
};

/**
 * Invalid exercise set - negative load
 */
export const invalidExerciseSet_Load = {
  set_type: SetType.WORKING,
  set_index: 1,
  reps: 10,
  load: -10, // Min is 0
};

/**
 * Valid session status updates
 */
export const validStatusUpdates = {
  completed: { status: SessionStatus.COMPLETED },
  cancelled: { status: SessionStatus.CANCELLED },
};

/**
 * Invalid session status update
 */
export const invalidStatusUpdate = {
  status: SessionStatus.IN_PROGRESS, // Can't update to in_progress
};

/**
 * Valid session exercise update
 */
export const validSessionExerciseUpdate = {
  notes: 'Updated notes - felt really strong today',
};

/**
 * Invalid session exercise update - notes too long
 */
export const invalidSessionExerciseUpdate = {
  notes: 'x'.repeat(501), // Max is 500
};

/**
 * OAuth mock tokens
 */
export const mockOAuthTokens = {
  google: {
    valid: 'mock-valid-google-token',
    invalid: 'mock-invalid-google-token',
  },
  apple: {
    valid: 'mock-valid-apple-token',
    invalid: 'mock-invalid-apple-token',
  },
};

/**
 * Pagination test parameters
 */
export const paginationParams = {
  default: {},
  page1: { limit: 10, offset: 0 },
  page2: { limit: 10, offset: 10 },
  largeLimit: { limit: 100, offset: 0 },
  invalidLimit: { limit: 101, offset: 0 }, // Max is 100
  negativeOffset: { limit: 10, offset: -1 }, // Min is 0
};

/**
 * Search query parameters
 */
export const searchParams = {
  benchPress: { search: 'bench' },
  press: { search: 'press' },
  nonExistent: { search: 'nonexistent-exercise-name-12345' },
  empty: { search: '' },
};

