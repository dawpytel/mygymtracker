/**
 * Custom hook for preventing navigation with unsaved changes
 * Displays browser confirmation prompt when user tries to leave with unsaved data
 */

import React, { useEffect, useCallback, useRef } from "react";
import {
  useBeforeUnload,
  useLocation,
  UNSAFE_NavigationContext,
} from "react-router-dom";
import type { Navigator } from "react-router-dom";

/**
 * Hook to prompt user before leaving page with unsaved changes
 * @param isDirty - Whether there are unsaved changes
 * @param message - Custom message to display (optional)
 */
export function useUnsavedChangesPrompt(
  isDirty: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?"
): void {
  // Block browser navigation (closing tab, refresh, etc.)
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
          // Modern browsers ignore custom messages and show their own
          event.returnValue = message;
        }
      },
      [isDirty, message]
    ),
    { capture: true }
  );

  // Block React Router navigation using a custom implementation
  // This works with BrowserRouter (doesn't require data router)
  const location = useLocation();
  const { navigator } = React.useContext(UNSAFE_NavigationContext) as {
    navigator: Navigator;
  };
  const currentLocation = useRef(location);

  useEffect(() => {
    currentLocation.current = location;
  }, [location]);

  useEffect(() => {
    if (!isDirty) return;

    // Store original push/replace methods
    const originalPush = navigator.push;
    const originalReplace = navigator.replace;

    // Override push method
    navigator.push = (...args: Parameters<typeof originalPush>) => {
      const result = window.confirm(message);
      if (result) {
        originalPush.apply(navigator, args);
      }
    };

    // Override replace method
    navigator.replace = (...args: Parameters<typeof originalReplace>) => {
      const result = window.confirm(message);
      if (result) {
        originalReplace.apply(navigator, args);
      }
    };

    // Restore original methods on cleanup
    return () => {
      navigator.push = originalPush;
      navigator.replace = originalReplace;
    };
  }, [isDirty, message, navigator]);
}
