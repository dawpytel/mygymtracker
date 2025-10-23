/**
 * SessionDetailPage Component
 * Page for viewing and editing a workout session
 */

import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionDetail } from "../hooks/useSessionDetail";
import { useUnsavedChangesPrompt } from "../hooks/useUnsavedChanges";
import { HeaderBar } from "../components/HeaderBar";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ErrorBanner } from "../components/ErrorBanner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExerciseAccordion } from "../components/sessions/ExerciseAccordion";
import type { SetViewModel } from "../types/sessions";
import { useState } from "react";

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    session,
    formState,
    loading,
    error,
    isDirty,
    saving,
    updateSetData,
    updateExerciseNotes,
    saveSession,
    completeSession,
    cancelSession,
    fetchSession,
  } = useSessionDetail(id || "");

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Block navigation if there are unsaved changes
  useUnsavedChangesPrompt(isDirty);

  // Handle set data change
  const handleSetChange = useCallback(
    (exerciseId: string, setIndex: number, data: Partial<SetViewModel>) => {
      updateSetData(exerciseId, setIndex, data);
    },
    [updateSetData]
  );

  // Handle notes change
  const handleNotesChange = useCallback(
    (exerciseId: string, notes: string) => {
      updateExerciseNotes(exerciseId, notes);
    },
    [updateExerciseNotes]
  );

  // Handle complete workout
  const handleCompleteClick = useCallback(() => {
    setShowCompleteConfirm(true);
  }, []);

  const handleConfirmComplete = useCallback(async () => {
    try {
      // Save changes first if dirty
      if (isDirty) {
        await saveSession();
      }
      // Then complete the session
      await completeSession();
      setShowCompleteConfirm(false);
      navigate("/sessions");
    } catch (err) {
      // Error is handled in the hook
      console.error("Failed to complete session:", err);
      setShowCompleteConfirm(false);
    }
  }, [isDirty, saveSession, completeSession, navigate]);

  const handleCancelComplete = useCallback(() => {
    setShowCompleteConfirm(false);
  }, []);

  // Handle cancel workout
  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    try {
      await cancelSession();
      setShowCancelConfirm(false);
      navigate("/sessions");
    } catch (err) {
      // Error is handled in the hook
      console.error("Failed to cancel session:", err);
      setShowCancelConfirm(false);
    }
  }, [cancelSession, navigate]);

  const handleCancelDelete = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchSession();
  }, [fetchSession]);

  // Render content based on state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar title="Workout Session" />
        <LoadingIndicator message="Loading session..." />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar title="Workout Session" />
        <div className="px-4 py-6">
          <ErrorBanner message={error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  if (!session) {
    console.warn("SessionDetailPage: No session data available");
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderBar title="Workout Session" />
        <div className="px-4 py-6">
          <ErrorBanner message="Session not found" />
        </div>
      </div>
    );
  }

  console.log("SessionDetailPage: Rendering with session", session);
  console.log("SessionDetailPage: Form state", formState);

  const isCompleted = session.status === "completed";
  const isCancelled = session.status === "cancelled";
  const isReadOnly = isCompleted || isCancelled;

  // Check if save button should be disabled
  const canSave =
    isDirty &&
    session.exercises.some((exercise) => {
      const formExercise = formState.exercises[exercise.id];
      return formExercise?.sets.some(
        (set) => set.reps !== undefined && set.load !== undefined
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <HeaderBar
        title="Workout Session"
        actionLabel="Back"
        onAction={() => navigate("/sessions")}
      />

      <main className="px-4 py-6">
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={handleRetry} />
          </div>
        )}

        {/* Session Info */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {session.status.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Started</p>
              <p className="text-sm font-medium text-gray-900">
                {session.startedAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Read-only notice */}
        {isReadOnly && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              This session is {session.status.replace("_", " ")} and cannot be
              edited.
            </p>
          </div>
        )}

        {/* Exercise Accordions */}
        <div className="space-y-4">
          {session.exercises.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No exercises in this session
            </div>
          )}
          {session.exercises.map((exercise) => {
            console.log("Rendering exercise", exercise.id, exercise);
            const formExercise = formState.exercises[exercise.id];
            console.log("Form exercise for", exercise.id, formExercise);

            if (!formExercise) {
              console.warn("Missing form exercise for", exercise.id);
              return null;
            }

            return (
              <ExerciseAccordion
                key={exercise.id}
                exercise={{
                  ...exercise,
                  notes: formExercise.notes,
                  sets: formExercise.sets,
                }}
                onSetChange={(setIndex, data) =>
                  handleSetChange(exercise.id, setIndex, data)
                }
                onNotesChange={(notes) => handleNotesChange(exercise.id, notes)}
              />
            );
          })}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <button
              onClick={handleCancelClick}
              disabled={saving}
              className="flex-1 px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Workout
            </button>
            <button
              onClick={handleCompleteClick}
              disabled={!canSave || saving}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Complete Workout"}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Complete Dialog */}
      <ConfirmDialog
        isOpen={showCompleteConfirm}
        title="Complete Workout"
        message="Are you sure you want to complete this workout? Your progress will be saved."
        confirmLabel={saving ? "Completing..." : "Complete"}
        cancelLabel="Cancel"
        onConfirm={handleConfirmComplete}
        onCancel={handleCancelComplete}
      />

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Cancel Workout"
        message="Are you sure you want to cancel this workout? All progress will be lost and cannot be recovered."
        confirmLabel={saving ? "Cancelling..." : "Cancel Workout"}
        cancelLabel="Keep Workout"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
