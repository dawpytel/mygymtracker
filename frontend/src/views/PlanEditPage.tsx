/**
 * PlanEditPage Component
 * Main page for editing an existing workout plan
 */

import { PlanForm } from "../components/PlanForm";
import { HeaderBar } from "../components/HeaderBar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorBanner } from "../components/ErrorBanner";
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiDelete } from "../lib/api";
import type { WorkoutPlanDto } from "../types/api";
import type { PlanExerciseVM } from "../types/viewModels";

export function PlanEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<{
    planName: string;
    exercises: PlanExerciseVM[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Plan ID is required");
      setIsLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        const plan = await apiGet<WorkoutPlanDto>(`/plans/${id}`);

        // Transform API DTO to form data
        setInitialData({
          planName: plan.plan_name,
          exercises: plan.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            display_order: ex.display_order,
            intensity_technique: ex.intensity_technique,
            warmup_sets: ex.warmup_sets,
            working_sets: ex.working_sets,
            target_reps: ex.target_reps,
            rpe_early: ex.rpe_early,
            rpe_last: ex.rpe_last,
            rest_time: ex.rest_time,
            notes: ex.notes,
          })),
        });
      } catch (err) {
        console.error("Failed to fetch plan:", err);
        setError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [id]);

  const handleCancel = useCallback(() => {
    navigate("/plans");
  }, [navigate]);

  const handleSuccess = useCallback(() => {
    navigate("/plans");
  }, [navigate]);

  const handleDeleteClick = useCallback(() => {
    setDeleteError(null);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteConfirmOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await apiDelete(`/plans/${id}`);
      // On success, navigate to plans list
      navigate("/plans");
    } catch (err) {
      console.error("Failed to delete plan:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete plan";
      setDeleteError(errorMessage);
      // Keep modal open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar title="Edit Workout Plan" />
        <main className="px-4 py-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading plan...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar title="Edit Workout Plan" />
        <main className="px-4 py-6 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600 mt-1">{error || "Plan not found"}</p>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Plans
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar title="Edit Workout Plan" />
      <main className="px-4 py-6 max-w-4xl mx-auto">
        {/* Delete Error Banner */}
        {deleteError && (
          <ErrorBanner
            message={deleteError}
            onRetry={() => setIsDeleteConfirmOpen(true)}
          />
        )}

        {/* Delete Button */}
        <div className="mb-6">
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete workout plan"
            disabled={isDeleting}
          >
            Delete Plan
          </button>
        </div>

        <PlanForm
          planId={id}
          initialData={initialData}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </main>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Plan"
        message={`Are you sure you want to delete "${initialData.planName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
}
