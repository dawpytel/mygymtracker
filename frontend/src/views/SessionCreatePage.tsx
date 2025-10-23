/**
 * SessionCreatePage Component
 * Page for selecting a workout plan and starting a new session
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlans } from "../hooks/usePlans";
import { useSessions } from "../hooks/useSessions";
import { apiPost, apiDelete } from "../lib/api";
import { HeaderBar } from "../components/HeaderBar";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { PlanSelectCard } from "../components/sessions/PlanSelectCard";
import { ConfirmOverwriteModal } from "../components/sessions/ConfirmOverwriteModal";
import type {
  CreateWorkoutSessionDto,
  CreateWorkoutSessionResponseDto,
} from "../types/sessions";

const ITEMS_PER_PAGE = 20;

export function SessionCreatePage() {
  const navigate = useNavigate();

  // Fetch workout plans
  const {
    items: plans,
    loading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = usePlans(ITEMS_PER_PAGE);

  // Check for existing in-progress sessions
  const { items: inProgressSessions, loading: sessionsLoading } = useSessions(
    "in_progress",
    1
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's an in-progress session
  const hasInProgressSession =
    !sessionsLoading && inProgressSessions.length > 0;

  // Handle starting a session
  const handleStartSession = useCallback(
    async (planId: string) => {
      // Check if there's an in-progress session
      if (hasInProgressSession) {
        setSelectedPlanId(planId);
        setIsConfirmOpen(true);
        return;
      }

      // No in-progress session, proceed directly
      await createSession(planId);
    },
    [hasInProgressSession]
  );

  // Create the session
  const createSession = useCallback(
    async (planId: string) => {
      setIsCreating(true);
      setError(null);

      try {
        // If there's an in-progress session, cancel it first
        if (hasInProgressSession && inProgressSessions.length > 0) {
          const existingSessionId = inProgressSessions[0].id;
          await apiDelete(`/sessions/${existingSessionId}`);
        }

        // Create new session
        const createData: CreateWorkoutSessionDto = {
          plan_id: planId,
        };

        const response = await apiPost<CreateWorkoutSessionResponseDto>(
          "/sessions",
          createData
        );

        // Navigate to the new session detail page
        navigate(`/sessions/${response.id}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start session";
        setError(errorMessage);
      } finally {
        setIsCreating(false);
        setIsConfirmOpen(false);
        setSelectedPlanId(null);
      }
    },
    [hasInProgressSession, inProgressSessions, navigate]
  );

  // Handle confirm from modal
  const handleConfirmOverwrite = useCallback(async () => {
    if (!selectedPlanId) return;
    await createSession(selectedPlanId);
  }, [selectedPlanId, createSession]);

  // Handle cancel from modal
  const handleCancelOverwrite = useCallback(() => {
    setIsConfirmOpen(false);
    setSelectedPlanId(null);
  }, []);

  // Handle navigation back
  const handleBack = useCallback(() => {
    navigate("/sessions");
  }, [navigate]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refetchPlans();
  }, [refetchPlans]);

  // Handle navigation to create plan
  const handleCreatePlan = useCallback(() => {
    navigate("/plans/new");
  }, [navigate]);

  // Render content based on state
  const renderContent = () => {
    if (plansLoading) {
      return <LoadingIndicator message="Loading plans..." />;
    }

    if (plansError) {
      return (
        <div className="px-4 py-6">
          <ErrorBanner message={plansError} onRetry={handleRetry} />
        </div>
      );
    }

    if (plans.length === 0) {
      return (
        <EmptyState
          message="No workout plans available"
          ctaLabel="Create Your First Plan"
          onCta={handleCreatePlan}
        />
      );
    }

    return (
      <>
        {error && (
          <div className="px-4 pt-6">
            <ErrorBanner message={error} onRetry={handleRetry} />
          </div>
        )}
        <div className="px-4 py-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select a workout plan to start your session
          </p>
          {plans.map((plan) => (
            <PlanSelectCard
              key={plan.id}
              plan={plan}
              onStart={handleStartSession}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar
        title="Start Workout Session"
        actionLabel="Back"
        onAction={handleBack}
      />
      <main>{renderContent()}</main>
      <ConfirmOverwriteModal
        isOpen={isConfirmOpen}
        isProcessing={isCreating}
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </div>
  );
}

