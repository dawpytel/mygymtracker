/**
 * Timer Component
 * Rest timer with start/reset functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface TimerProps {
  restTimeSeconds: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Timer({ restTimeSeconds }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(restTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            // Play audio notification (optional)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(restTimeSeconds);
  }, [restTimeSeconds]);

  const isFinished = timeRemaining === 0;

  return (
    <div className="bg-white border border-gray-300 rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">Rest Timer</p>
          <p
            className={`text-2xl font-bold ${
              isFinished
                ? "text-green-600"
                : isRunning
                  ? "text-blue-600"
                  : "text-gray-900"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {formatTime(timeRemaining)}
          </p>
          {isFinished && (
            <p className="text-sm text-green-600 font-medium mt-1">
              Rest complete!
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && !isFinished && (
            <button
              onClick={handleStart}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Start timer"
            >
              Start
            </button>
          )}
          {isRunning && (
            <button
              onClick={handlePause}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              aria-label="Pause timer"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Reset timer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

