/**
 * SetInput Component
 * Input fields for a single set (reps and load)
 */

import { SetType, type SetViewModel } from "../../types/sessions";

interface SetInputProps {
  set: SetViewModel;
  onChange: (setIndex: number, data: Partial<SetViewModel>) => void;
}

export function SetInput({ set, onChange }: SetInputProps) {
  const isWarmup = set.setType === SetType.WARMUP;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0 w-20">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            isWarmup
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isWarmup ? "Warmup" : "Working"} {set.setIndex}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1">
          <label htmlFor={`reps-${set.setIndex}`} className="sr-only">
            Reps for set {set.setIndex}
          </label>
          <div className="relative">
            <input
              id={`reps-${set.setIndex}`}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={set.reps ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onChange(set.setIndex, {
                  reps: value ? parseInt(value, 10) : undefined,
                });
              }}
              placeholder="Reps"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-label={`Reps for set ${set.setIndex}`}
            />
            <span className="absolute right-3 top-2 text-sm text-gray-500">
              reps
            </span>
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor={`load-${set.setIndex}`} className="sr-only">
            Load for set {set.setIndex}
          </label>
          <div className="relative">
            <input
              id={`load-${set.setIndex}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={set.load ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onChange(set.setIndex, {
                  load: value ? parseFloat(value) : undefined,
                });
              }}
              placeholder="Load"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-label={`Load for set ${set.setIndex}`}
            />
            <span className="absolute right-3 top-2 text-sm text-gray-500">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

