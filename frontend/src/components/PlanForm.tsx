/**
 * PlanForm Component
 * Main form for creating/editing workout plans
 */

import { useCallback, useState } from "react";
import { usePlanForm } from "../hooks/usePlanForm";
import { PlanHeader } from "./PlanHeader";
import { ExerciseList } from "./ExerciseList";
import { ExerciseDialogForm } from "./ExerciseDialogForm";
import { AddExerciseButton } from "./AddExerciseButton";
import { SavePlanControls } from "./SavePlanControls";
import { FormValidationErrors } from "./FormValidationErrors";
import type { ExerciseDto } from "../types/api";
import type { PlanExerciseVM } from "../types/viewModels";

interface PlanFormProps {
  planId?: string;
  initialData?: {
    planName: string;
    exercises: PlanExerciseVM[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanForm({ planId, initialData, onSuccess, onCancel }: PlanFormProps) {
  const {
    planName,
    exercises,
    formErrors,
    isSubmitting,
    setPlanName,
    addExercise,
    updateExercise,
    removeExercise,
    submitPlan,
  } = usePlanForm({ planId, initialData });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  /**
   * Open dialog to add a new exercise
   */
  const handleAddExercise = useCallback(() => {
    setEditingIndex(null);
    setIsDialogOpen(true);
  }, []);

  /**
   * Open dialog to edit an existing exercise
   */
  const handleEditExercise = useCallback((index: number) => {
    setEditingIndex(index);
    setIsDialogOpen(true);
  }, []);

  /**
   * Close the dialog
   */
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingIndex(null);
  }, []);

  /**
   * Save exercise from dialog
   */
  const handleSaveExercise = useCallback(
    (exercise: PlanExerciseVM) => {
      if (editingIndex !== null) {
        // Update existing exercise
        updateExercise(editingIndex, exercise);
      } else {
        // Add new exercise with all parameters
        const exerciseDto: ExerciseDto = {
          id: exercise.exercise_id,
          name: exercise.exercise_name,
        };
        addExercise(exerciseDto, exercise);
      }
      
      handleCloseDialog();
    },
    [editingIndex, addExercise, updateExercise, handleCloseDialog]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        await submitPlan();
        onSuccess();
      } catch (error) {
        // Error is already handled in the hook
        console.error("Failed to submit plan:", error);
      }
    },
    [submitPlan, onSuccess]
  );

  /**
   * Handle save button click
   */
  const handleSaveClick = useCallback(() => {
    // Trigger form submit
    const form = document.querySelector('form');
    form?.requestSubmit();
  }, []);

  const isFormValid = planName.trim().length > 0 && exercises.length > 0;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormValidationErrors errors={formErrors} />

        {/* Plan Name Input */}
        <PlanHeader
          name={planName}
          onNameChange={setPlanName}
          disabled={isSubmitting}
        />

        {/* Add Exercise Button */}
        <AddExerciseButton onClick={handleAddExercise} disabled={isSubmitting} />

        {/* Exercises List */}
        <ExerciseList
          exercises={exercises}
          onEdit={handleEditExercise}
          onDelete={removeExercise}
          disabled={isSubmitting}
        />

        {/* Form Actions */}
        <SavePlanControls
          onSave={handleSaveClick}
          onCancel={onCancel}
          disabled={!isFormValid}
          isSubmitting={isSubmitting}
          saveLabel={planId ? "Update Plan" : "Create Plan"}
        />
      </form>

      {/* Exercise Dialog */}
      <ExerciseDialogForm
        isOpen={isDialogOpen}
        initial={editingIndex !== null ? exercises[editingIndex] : undefined}
        onClose={handleCloseDialog}
        onSave={handleSaveExercise}
      />
    </>
  );
}
