/**
 * Navigation Component
 * Bottom navigation bar for switching between main sections
 */

import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearTokens } = useAuthContext();

  const isPlansActive = location.pathname.startsWith("/plans");
  const isSessionsActive = location.pathname.startsWith("/sessions");

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        <button
          onClick={() => navigate("/plans")}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            isPlansActive
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          aria-current={isPlansActive ? "page" : undefined}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs font-medium">Plans</span>
        </button>

        <button
          onClick={() => navigate("/sessions")}
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            isSessionsActive
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          aria-current={isSessionsActive ? "page" : undefined}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="text-xs font-medium">Sessions</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-red-600 transition-colors"
          aria-label="Logout"
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}

