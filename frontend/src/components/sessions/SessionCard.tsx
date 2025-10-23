/**
 * SessionCard Component
 * Displays a session summary with status, start date, and completion date
 */

import type { SessionCardViewModel } from "../../types/sessions";

interface SessionCardProps {
  session: SessionCardViewModel;
  onClick: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: SessionCardViewModel["status"]) {
  switch (status) {
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  return (
    <article
      onClick={onClick}
      className="
        p-4 bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md hover:border-gray-300 transition-all cursor-pointer
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
      "
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Workout Session
          </h3>
        </div>
        {getStatusBadge(session.status)}
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div>
          <span className="font-medium">Started:</span>{" "}
          {formatDate(session.startedAt)} at {formatTime(session.startedAt)}
        </div>

        {session.completedAt && (
          <div>
            <span className="font-medium">Completed:</span>{" "}
            {formatDate(session.completedAt)} at{" "}
            {formatTime(session.completedAt)}
          </div>
        )}
      </div>
    </article>
  );
}

