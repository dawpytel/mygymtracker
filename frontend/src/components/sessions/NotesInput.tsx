/**
 * NotesInput Component
 * Textarea for exercise notes with character count
 */

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export function NotesInput({
  value,
  onChange,
  maxLength = 500,
}: NotesInputProps) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining < 50;

  return (
    <div className="space-y-2">
      <label htmlFor="exercise-notes" className="block text-sm font-medium text-gray-700">
        Notes
      </label>
      <textarea
        id="exercise-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={3}
        placeholder="Add notes about this exercise (optional)"
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
        aria-describedby="notes-char-count"
      />
      <div
        id="notes-char-count"
        className={`text-xs text-right ${
          isNearLimit ? "text-orange-600 font-medium" : "text-gray-500"
        }`}
        aria-live="polite"
      >
        {remaining} characters remaining
      </div>
    </div>
  );
}

