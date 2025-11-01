/**
 * PlanHeader Component
 * Input field for the workout plan name with validation
 */

interface PlanHeaderProps {
  name: string;
  onNameChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PlanHeader({
  name,
  onNameChange,
  error,
  disabled = false,
}: PlanHeaderProps) {
  return (
    <div>
      <label
        htmlFor="plan-name"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Plan Name <span className="text-red-500">*</span>
      </label>
      <input
        id="plan-name"
        type="text"
        name="plan-name"
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        data-1p-ignore="true"
        data-bwignore="true"
        data-dashlane-ignore="true"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={100}
        required
        disabled={disabled}
        placeholder="e.g., Push Day, Pull Day, Leg Day"
        className={`block w-full rounded-md shadow-sm px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        }`}
        aria-describedby={
          error ? "plan-name-error plan-name-hint" : "plan-name-hint"
        }
        aria-invalid={error ? "true" : "false"}
      />
      {error && (
        <p
          id="plan-name-error"
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      <p id="plan-name-hint" className="mt-1 text-sm text-gray-500">
        {name.length}/100 characters
      </p>
    </div>
  );
}
