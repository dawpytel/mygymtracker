/**
 * ExerciseAutocomplete Component
 * Autocomplete search for selecting exercises with keyboard navigation
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { apiGet } from "../lib/api";
import type { ExerciseDto, ExerciseListDto } from "../types/api";

interface ExerciseAutocompleteProps {
  onSelect: (exercise: ExerciseDto) => void;
  disabled?: boolean;
}

export function ExerciseAutocomplete({
  onSelect,
  disabled = false,
}: ExerciseAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<ExerciseDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch exercise suggestions from API
   */
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        limit: "10",
      });

      const response = await apiGet<ExerciseListDto>(
        `/exercises?${queryParams.toString()}`
      );

      console.log("Fetched exercises from API:", response.items);
      setSuggestions(response.items);
      setIsOpen(response.items.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch exercises"
      );
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    },
    [fetchSuggestions]
  );

  /**
   * Handle suggestion selection
   */
  const handleSelect = useCallback(
    (exercise: ExerciseDto) => {
      console.log("Exercise selected from autocomplete:", exercise);
      console.log(
        "Exercise ID type:",
        typeof exercise.id,
        "Value:",
        exercise.id
      );
      onSelect(exercise);
      setInputValue("");
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [onSelect]
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelect]
  );

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label
        htmlFor="exercise-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Add Exercise
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="exercise-search"
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          placeholder="Search for an exercise..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed px-4 py-2 border"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="exercise-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            selectedIndex >= 0 ? `exercise-option-${selectedIndex}` : undefined
          }
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id="exercise-suggestions"
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {suggestions.map((exercise, index) => (
            <li
              key={exercise.id}
              id={`exercise-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(exercise)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                index === selectedIndex
                  ? "bg-blue-600 text-white"
                  : "text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span className="block truncate">{exercise.name}</span>
            </li>
          ))}
        </ul>
      )}

      {isOpen &&
        suggestions.length === 0 &&
        inputValue.length >= 2 &&
        !isLoading && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500 ring-1 ring-black ring-opacity-5">
            No exercises found
          </div>
        )}

      {inputValue.length > 0 && inputValue.length < 2 && (
        <p className="mt-1 text-sm text-gray-500">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}
