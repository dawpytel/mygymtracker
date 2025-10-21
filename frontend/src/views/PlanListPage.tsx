/**
 * PlanListPage Component
 * Main page for displaying and managing workout plans
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans } from '../hooks/usePlans';
import { HeaderBar } from '../components/HeaderBar';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { EmptyState } from '../components/EmptyState';
import { PlanCard } from '../components/PlanCard';
import { PaginationControls } from '../components/PaginationControls';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorBanner } from '../components/ErrorBanner';
import type { PlanListItemVM } from '../types/viewModels';

const ITEMS_PER_PAGE = 20;

export function PlanListPage() {
  const navigate = useNavigate();
  const { items, total, offset, loading, error, fetchPlans, deletePlan } =
    usePlans(ITEMS_PER_PAGE);

  const [selectedPlan, setSelectedPlan] = useState<PlanListItemVM | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Navigation handlers
  const handleCreate = useCallback(() => {
    navigate('/plans/create');
  }, [navigate]);

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/plans/${id}/edit`);
    },
    [navigate]
  );

  // Delete handlers
  const handleDeleteClick = useCallback((item: PlanListItemVM) => {
    setSelectedPlan(item);
    setIsConfirmOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setIsConfirmOpen(false);
    setSelectedPlan(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPlan) return;

    setIsDeleting(true);
    try {
      await deletePlan(selectedPlan.id);
      setIsConfirmOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      // Error is already set in the hook
      console.error('Failed to delete plan:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPlan, deletePlan]);

  // Pagination handler
  const handlePageChange = useCallback(
    (newOffset: number) => {
      fetchPlans(newOffset);
    },
    [fetchPlans]
  );

  // Retry handler for errors
  const handleRetry = useCallback(() => {
    fetchPlans(offset);
  }, [fetchPlans, offset]);

  // Render content based on state
  const renderContent = () => {
    if (loading && items.length === 0) {
      return <LoadingIndicator message="Loading plans..." />;
    }

    if (error && items.length === 0) {
      return (
        <div className="px-4 py-6">
          <ErrorBanner message={error} onRetry={handleRetry} />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          message="No workout plans yet"
          ctaLabel="Create New Plan"
          onCta={handleCreate}
        />
      );
    }

    return (
      <>
        {error && (
          <div className="px-4 py-6">
            <ErrorBanner message={error} onRetry={handleRetry} />
          </div>
        )}
        <ul className="divide-y divide-gray-200 px-4 py-6 space-y-4">
          {items.map((item) => (
            <PlanCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </ul>
        <PaginationControls
          limit={ITEMS_PER_PAGE}
          offset={offset}
          total={total}
          onPageChange={handlePageChange}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar
        title="Workout Plans"
        actionLabel="Create New Plan"
        onAction={handleCreate}
      />
      <main>{renderContent()}</main>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Plan"
        message={
          selectedPlan
            ? `Are you sure you want to delete "${selectedPlan.planName}"? This action cannot be undone.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

