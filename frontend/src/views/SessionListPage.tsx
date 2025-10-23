/**
 * SessionListPage Component
 * Main page for displaying and filtering workout sessions
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";
import { HeaderBar } from "../components/HeaderBar";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { EmptyState } from "../components/EmptyState";
import { FilterTabs } from "../components/sessions/FilterTabs";
import { SessionCard } from "../components/sessions/SessionCard";
import { PaginationControls } from "../components/PaginationControls";
import { ErrorBanner } from "../components/ErrorBanner";
import type { FilterStatus } from "../types/sessions";

const ITEMS_PER_PAGE = 20;

export function SessionListPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const { items, total, offset, loading, error, fetchSessions, refetch } =
    useSessions(filterStatus, ITEMS_PER_PAGE);

  // Navigation handlers
  const handleCreateSession = useCallback(() => {
    navigate("/sessions/new");
  }, [navigate]);

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      navigate(`/sessions/${sessionId}`);
    },
    [navigate]
  );

  // Filter handler
  const handleFilterChange = useCallback((newStatus: FilterStatus) => {
    setFilterStatus(newStatus);
  }, []);

  // Pagination handler
  const handlePageChange = useCallback(
    (newOffset: number) => {
      fetchSessions(newOffset);
    },
    [fetchSessions]
  );

  // Retry handler for errors
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render content based on state
  const renderContent = () => {
    if (loading && items.length === 0) {
      return <LoadingIndicator message="Loading sessions..." />;
    }

    if (error && items.length === 0) {
      return (
        <div className="px-4 py-6">
          <ErrorBanner message={error} onRetry={handleRetry} />
        </div>
      );
    }

    if (items.length === 0) {
      const emptyMessage =
        filterStatus === "all"
          ? "No workout sessions yet"
          : filterStatus === "in_progress"
            ? "No in-progress sessions"
            : "No completed sessions";

      return (
        <EmptyState
          message={emptyMessage}
          ctaLabel="Start New Session"
          onCta={handleCreateSession}
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
        <div
          id="sessions-list"
          role="tabpanel"
          className="px-4 py-6 space-y-4"
        >
          {items.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => handleSessionClick(session.id)}
            />
          ))}
        </div>
        {total > ITEMS_PER_PAGE && (
          <PaginationControls
            limit={ITEMS_PER_PAGE}
            offset={offset}
            total={total}
            onPageChange={handlePageChange}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HeaderBar
        title="Workout Sessions"
        actionLabel="Start New Session"
        onAction={handleCreateSession}
      />
      <main>
        <div className="px-4 pt-6">
          <FilterTabs
            currentStatus={filterStatus}
            onChange={handleFilterChange}
          />
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

