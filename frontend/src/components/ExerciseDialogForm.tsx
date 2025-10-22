/**
 * ExerciseDialogForm Component
 * Modal dialog for adding or editing an exercise in a workout plan
 */

import { useState, useCallback, useEffect } from "react";
import { ExerciseAutocomplete } from "./ExerciseAutocomplete";
import type { ExerciseDto, IntensityTechnique } from "../types/api";
import type { PlanExerciseVM } from "../types/viewModels";
import { IntensityTechnique as IntensityTechniqueEnum } from "../types/api";

interface ExerciseDialogFormProps {
  isOpen: boolean;
  initial?: PlanExerciseVM;
  onClose: () => void;
  onSave: (exercise: PlanExerciseVM) => void;
}

interface FormErrors {
  exercise_id?: string;
  warmup_sets?: string;
  working_sets?: string;
  target_reps?: string;
  rpe_early?: string;
  rpe_last?: string;
  rest_time?: string;
  notes?: string;
}

const INTENSITY_TECHNIQUES = [
  { value: IntensityTechniqueEnum.NA, label: "N/A" },
  { value: IntensityTechniqueEnum.DROP_SET, label: "Drop Set" },
  { value: IntensityTechniqueEnum.PAUSE, label: "Pause" },
  { value: IntensityTechniqueEnum.PARTIAL_LENGTH, label: "Partial Length" },
  { value: IntensityTechniqueEnum.FAIL, label: "Fail" },
  { value: IntensityTechniqueEnum.SUPERSET, label: "Superset" },
];

export function ExerciseDialogForm({
  isOpen,
  initial,
  onClose,
  onSave,
}: ExerciseDialogFormProps) {
  const [formData, setFormData] = useState<Partial<PlanExerciseVM>>({
    exercise_id: initial?.exercise_id || "",
    exercise_name: initial?.exercise_name || "",
    intensity_technique: initial?.intensity_technique || IntensityTechniqueEnum.NA,
    warmup_sets: initial?.warmup_sets ?? 0,
    working_sets: initial?.working_sets ?? 3,
    target_reps: initial?.target_reps ?? 10,
    rpe_early: initial?.rpe_early ?? 7,
    rpe_last: initial?.rpe_last ?? 9,
    rest_time: initial?.rest_time ?? 120,
    notes: initial?.notes || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when dialog opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        exercise_id: initial?.exercise_id || "",
        exercise_name: initial?.exercise_name || "",
        intensity_technique: initial?.intensity_technique || IntensityTechniqueEnum.NA,
        warmup_sets: initial?.warmup_sets ?? 0,
        working_sets: initial?.working_sets ?? 3,
        target_reps: initial?.target_reps ?? 10,
        rpe_early: initial?.rpe_early ?? 7,
        rpe_last: initial?.rpe_last ?? 9,
        rest_time: initial?.rest_time ?? 120,
        notes: initial?.notes || "",
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  /**
   * Handle exercise selection from autocomplete
   */
  const handleExerciseSelect = useCallback((exercise: ExerciseDto) => {
    setFormData((prev) => ({
      ...prev,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
    }));
    setErrors((prev) => ({ ...prev, exercise_id: undefined }));
  }, []);

  /**
   * Handle numeric field change with validation
   */
  const handleNumberChange = useCallback(
    (field: keyof PlanExerciseVM, value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({ ...prev, [field]: numValue }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    []
  );

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.exercise_id) {
      newErrors.exercise_id = "Please select an exercise";
    }

    if (formData.warmup_sets !== undefined && formData.warmup_sets < 0) {
      newErrors.warmup_sets = "Must be 0 or greater";
    }

    if (formData.working_sets !== undefined) {
      if (formData.working_sets < 0 || formData.working_sets > 4) {
        newErrors.working_sets = "Must be between 0 and 4";
      }
    }

    if (formData.target_reps !== undefined && formData.target_reps < 1) {
      newErrors.target_reps = "Must be at least 1";
    }

    if (formData.rpe_early !== undefined) {
      if (formData.rpe_early < 1 || formData.rpe_early > 10) {
        newErrors.rpe_early = "Must be between 1 and 10";
      }
    }

    if (formData.rpe_last !== undefined) {
      if (formData.rpe_last < 1 || formData.rpe_last > 10) {
        newErrors.rpe_last = "Must be between 1 and 10";
      }
    }

    if (formData.rest_time !== undefined && formData.rest_time < 0) {
      newErrors.rest_time = "Must be 0 or greater";
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Ensure all required fields are present
      if (
        formData.exercise_id &&
        formData.exercise_name &&
        formData.intensity_technique !== undefined &&
        formData.warmup_sets !== undefined &&
        formData.working_sets !== undefined &&
        formData.target_reps !== undefined &&
        formData.rpe_early !== undefined &&
        formData.rpe_last !== undefined &&
        formData.rest_time !== undefined &&
        formData.notes !== undefined
      ) {
        onSave({
          exercise_id: formData.exercise_id,
          exercise_name: formData.exercise_name,
          display_order: initial?.display_order ?? 0,
          intensity_technique: formData.intensity_technique,
          warmup_sets: formData.warmup_sets,
          working_sets: formData.working_sets,
          target_reps: formData.target_reps,
          rpe_early: formData.rpe_early,
          rpe_last: formData.rpe_last,
          rest_time: formData.rest_time,
          notes: formData.notes,
        });
      }
    },
    [formData, initial, validateForm, onSave]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h2 id="exercise-dialog-title" className="text-xl font-semibold text-gray-900">
                {initial ? "Edit Exercise" : "Add Exercise"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                aria-label="Close dialog"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Exercise Selection */}
            {!initial && (
              <div>
                <ExerciseAutocomplete onSelect={handleExerciseSelect} />
                {errors.exercise_id && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.exercise_id}
                  </p>
                )}
                {formData.exercise_name && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: <strong>{formData.exercise_name}</strong>
                  </p>
                )}
              </div>
            )}

            {initial && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise
                </label>
                <p className="text-base font-semibold text-gray-900">
                  {formData.exercise_name}
                </p>
              </div>
            )}

            {/* Intensity Technique */}
            <div>
              <label
                htmlFor="intensity-technique"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Intensity Technique
              </label>
              <select
                id="intensity-technique"
                value={formData.intensity_technique}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    intensity_technique: e.target.value as IntensityTechnique,
                  }))
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              >
                {INTENSITY_TECHNIQUES.map((tech) => (
                  <option key={tech.value} value={tech.value}>
                    {tech.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sets Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="warmup-sets"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Warmup Sets
                </label>
                <input
                  id="warmup-sets"
                  type="number"
                  min="0"
                  value={formData.warmup_sets}
                  onChange={(e) => handleNumberChange("warmup_sets", e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                    errors.warmup_sets
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  aria-invalid={errors.warmup_sets ? "true" : "false"}
                />
                {errors.warmup_sets && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.warmup_sets}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="working-sets"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Working Sets <span className="text-red-500">*</span>
                </label>
                <input
                  id="working-sets"
                  type="number"
                  min="0"
                  max="4"
                  value={formData.working_sets}
                  onChange={(e) => handleNumberChange("working_sets", e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                    errors.working_sets
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  aria-invalid={errors.working_sets ? "true" : "false"}
                />
                {errors.working_sets && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.working_sets}
                  </p>
                )}
              </div>
            </div>

            {/* Target Reps */}
            <div>
              <label
                htmlFor="target-reps"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Target Reps <span className="text-red-500">*</span>
              </label>
              <input
                id="target-reps"
                type="number"
                min="1"
                value={formData.target_reps}
                onChange={(e) => handleNumberChange("target_reps", e.target.value)}
                className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                  errors.target_reps
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                aria-invalid={errors.target_reps ? "true" : "false"}
              />
              {errors.target_reps && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.target_reps}
                </p>
              )}
            </div>

            {/* RPE Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rpe-early"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  RPE Early Sets <span className="text-red-500">*</span>
                </label>
                <input
                  id="rpe-early"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rpe_early}
                  onChange={(e) => handleNumberChange("rpe_early", e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                    errors.rpe_early
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  aria-invalid={errors.rpe_early ? "true" : "false"}
                />
                {errors.rpe_early && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.rpe_early}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="rpe-last"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  RPE Last Set <span className="text-red-500">*</span>
                </label>
                <input
                  id="rpe-last"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rpe_last}
                  onChange={(e) => handleNumberChange("rpe_last", e.target.value)}
                  className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                    errors.rpe_last
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  aria-invalid={errors.rpe_last ? "true" : "false"}
                />
                {errors.rpe_last && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.rpe_last}
                  </p>
                )}
              </div>
            </div>

            {/* Rest Time */}
            <div>
              <label
                htmlFor="rest-time"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rest Time (seconds) <span className="text-red-500">*</span>
              </label>
              <input
                id="rest-time"
                type="number"
                min="0"
                value={formData.rest_time}
                onChange={(e) => handleNumberChange("rest_time", e.target.value)}
                className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                  errors.rest_time
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                aria-invalid={errors.rest_time ? "true" : "false"}
              />
              {errors.rest_time && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.rest_time}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                maxLength={500}
                rows={3}
                className={`block w-full rounded-md shadow-sm px-4 py-2 border ${
                  errors.notes
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Additional notes about this exercise..."
                aria-invalid={errors.notes ? "true" : "false"}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.notes?.length || 0}/500 characters
              </p>
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.notes}
                </p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-4 px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {initial ? "Update Exercise" : "Add Exercise"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

