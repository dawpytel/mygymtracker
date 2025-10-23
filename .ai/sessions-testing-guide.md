# Sessions View - Testing Guide

## Testing Strategy Overview

This guide outlines the testing approach for the Sessions View implementation. Since the testing framework is not yet configured, this document provides test cases and examples that can be implemented once Vitest and React Testing Library are set up.

## Recommended Testing Stack

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0"
  }
}
```

## Unit Tests

### 1. Custom Hooks Tests

#### `useSessions.test.ts`

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useSessions } from "../hooks/useSessions";
import { apiGet } from "../lib/api";
import { SessionStatus } from "../types/sessions";

// Mock API
vi.mock("../lib/api");

describe("useSessions", () => {
  it("should fetch sessions on mount", async () => {
    const mockSessions = {
      items: [
        {
          id: "1",
          status: "in_progress",
          started_at: "2025-01-01T10:00:00Z",
          completed_at: null,
        },
      ],
      total: 1,
    };

    vi.mocked(apiGet).mockResolvedValue(mockSessions);

    const { result } = renderHook(() => useSessions("all", 20));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.items).toHaveLength(1);
      expect(result.current.total).toBe(1);
    });
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSessions("all", 20));

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
      expect(result.current.items).toHaveLength(0);
    });
  });

  it("should filter sessions by status", async () => {
    const mockSessions = {
      items: [],
      total: 0,
    };

    vi.mocked(apiGet).mockResolvedValue(mockSessions);

    renderHook(() => useSessions("completed", 20));

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining("status=completed")
      );
    });
  });
});
```

#### `useSessionDetail.test.ts`

```typescript
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSessionDetail } from "../hooks/useSessionDetail";
import { apiGet, apiPatch, apiDelete } from "../lib/api";

vi.mock("../lib/api");

describe("useSessionDetail", () => {
  const mockSessionId = "session-123";

  it("should fetch session detail on mount", async () => {
    const mockSession = {
      id: mockSessionId,
      status: "in_progress",
      started_at: "2025-01-01T10:00:00Z",
      completed_at: null,
      exercises: [],
    };

    vi.mocked(apiGet).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSessionDetail(mockSessionId));

    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
      expect(result.current.session?.id).toBe(mockSessionId);
    });
  });

  it("should update set data and mark as dirty", async () => {
    const mockSession = {
      id: mockSessionId,
      status: "in_progress",
      started_at: "2025-01-01T10:00:00Z",
      completed_at: null,
      exercises: [
        {
          id: "ex-1",
          exercise_id: "exercise-1",
          exercise_name: "Bench Press",
          display_order: 0,
          target_reps: 10,
          rpe_early: 7,
          rpe_last: 9,
          rest_time: 120,
          intensity_technique: "N/A",
          notes: "",
          history: [],
          sets: [
            {
              id: "set-1",
              setType: "working",
              setIndex: 1,
              reps: undefined,
              load: undefined,
            },
          ],
        },
      ],
    };

    vi.mocked(apiGet).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSessionDetail(mockSessionId));

    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
    });

    act(() => {
      result.current.updateSetData("ex-1", 1, { reps: 10, load: 80 });
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.formState.exercises["ex-1"].sets[0].reps).toBe(10);
    expect(result.current.formState.exercises["ex-1"].sets[0].load).toBe(80);
  });

  it("should save session changes", async () => {
    // Test implementation
  });

  it("should complete session", async () => {
    // Test implementation
  });

  it("should cancel session", async () => {
    // Test implementation
  });
});
```

### 2. Component Tests

#### `FilterTabs.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterTabs } from "../components/sessions/FilterTabs";

describe("FilterTabs", () => {
  it("should render all filter options", () => {
    render(<FilterTabs currentStatus="all" onChange={() => {}} />);

    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /in progress/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /completed/i })).toBeInTheDocument();
  });

  it("should mark current status as selected", () => {
    render(<FilterTabs currentStatus="in_progress" onChange={() => {}} />);

    const inProgressTab = screen.getByRole("tab", { name: /in progress/i });
    expect(inProgressTab).toHaveAttribute("aria-selected", "true");
  });

  it("should call onChange when tab is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<FilterTabs currentStatus="all" onChange={handleChange} />);

    const completedTab = screen.getByRole("tab", { name: /completed/i });
    await user.click(completedTab);

    expect(handleChange).toHaveBeenCalledWith("completed");
  });
});
```

#### `SessionCard.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionCard } from "../components/sessions/SessionCard";
import { SessionStatus } from "../types/sessions";

describe("SessionCard", () => {
  const mockSession = {
    id: "session-1",
    status: SessionStatus.IN_PROGRESS,
    startedAt: new Date("2025-01-01T10:00:00Z"),
  };

  it("should render session information", () => {
    render(<SessionCard session={mockSession} onClick={() => {}} />);

    expect(screen.getByText(/workout session/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/started:/i)).toBeInTheDocument();
  });

  it("should show completed date when session is completed", () => {
    const completedSession = {
      ...mockSession,
      status: SessionStatus.COMPLETED,
      completedAt: new Date("2025-01-01T12:00:00Z"),
    };

    render(<SessionCard session={completedSession} onClick={() => {}} />);

    expect(screen.getByText(/completed:/i)).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SessionCard session={mockSession} onClick={handleClick} />);

    const card = screen.getByRole("button");
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be keyboard accessible", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SessionCard session={mockSession} onClick={handleClick} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard("{Enter}");

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### `ExerciseAccordion.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseAccordion } from "../components/sessions/ExerciseAccordion";

describe("ExerciseAccordion", () => {
  const mockExercise = {
    id: "ex-1",
    exerciseId: "exercise-1",
    exerciseName: "Bench Press",
    displayOrder: 0,
    targetReps: 10,
    rpeEarly: 7,
    rpeLast: 9,
    restTime: 120,
    intensityTechnique: "drop_set",
    notes: "",
    history: [],
    sets: [
      {
        id: "set-1",
        setType: "working" as const,
        setIndex: 1,
        reps: undefined,
        load: undefined,
      },
    ],
  };

  it("should render exercise name and summary", () => {
    render(
      <ExerciseAccordion
        exercise={mockExercise}
        onSetChange={() => {}}
        onNotesChange={() => {}}
      />
    );

    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText(/10 reps/i)).toBeInTheDocument();
    expect(screen.getByText(/rpe 7-9/i)).toBeInTheDocument();
  });

  it("should expand and show content when clicked", async () => {
    const user = userEvent.setup();

    render(
      <ExerciseAccordion
        exercise={mockExercise}
        onSetChange={() => {}}
        onNotesChange={() => {}}
      />
    );

    const button = screen.getByRole("button", { expanded: false });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/technique:/i)).toBeInTheDocument();
  });
});
```

#### `SetInput.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetInput } from "../components/sessions/SetInput";
import { SetType } from "../types/sessions";

describe("SetInput", () => {
  const mockSet = {
    setType: SetType.WORKING,
    setIndex: 1,
    reps: undefined,
    load: undefined,
  };

  it("should render reps and load inputs", () => {
    render(<SetInput set={mockSet} onChange={() => {}} />);

    expect(screen.getByLabelText(/reps for set 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/load for set 1/i)).toBeInTheDocument();
  });

  it("should call onChange when reps is updated", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SetInput set={mockSet} onChange={handleChange} />);

    const repsInput = screen.getByLabelText(/reps for set 1/i);
    await user.type(repsInput, "10");

    expect(handleChange).toHaveBeenCalledWith(1, { reps: 10 });
  });

  it("should call onChange when load is updated", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<SetInput set={mockSet} onChange={handleChange} />);

    const loadInput = screen.getByLabelText(/load for set 1/i);
    await user.type(loadInput, "80.5");

    expect(handleChange).toHaveBeenCalledWith(1, { load: 80.5 });
  });

  it("should show warmup badge for warmup sets", () => {
    const warmupSet = { ...mockSet, setType: SetType.WARMUP };

    render(<SetInput set={warmupSet} onChange={() => {}} />);

    expect(screen.getByText(/warmup/i)).toBeInTheDocument();
  });
});
```

#### `Timer.test.tsx`

```typescript
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Timer } from "../components/sessions/Timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display initial rest time", () => {
    render(<Timer restTimeSeconds={120} />);

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("should start countdown when start button is clicked", async () => {
    const user = userEvent.setup({ delay: null });

    render(<Timer restTimeSeconds={120} />);

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("1:59")).toBeInTheDocument();
  });

  it("should pause countdown when pause button is clicked", async () => {
    const user = userEvent.setup({ delay: null });

    render(<Timer restTimeSeconds={120} />);

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const pauseButton = screen.getByRole("button", { name: /pause/i });
    await user.click(pauseButton);

    const currentTime = screen.getByText("1:59");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(currentTime).toBeInTheDocument();
  });

  it("should reset timer when reset button is clicked", async () => {
    const user = userEvent.setup({ delay: null });

    render(<Timer restTimeSeconds={120} />);

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    expect(screen.getByText("2:00")).toBeInTheDocument();
  });
});
```

## Integration Tests

### Page-Level Tests

#### `SessionListPage.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { SessionListPage } from "../views/SessionListPage";
import { apiGet } from "../lib/api";

vi.mock("../lib/api");

describe("SessionListPage", () => {
  it("should render loading state initially", () => {
    render(
      <BrowserRouter>
        <SessionListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
  });

  it("should render sessions after loading", async () => {
    const mockSessions = {
      items: [
        {
          id: "1",
          status: "in_progress",
          started_at: "2025-01-01T10:00:00Z",
          completed_at: null,
        },
      ],
      total: 1,
    };

    vi.mocked(apiGet).mockResolvedValue(mockSessions);

    render(
      <BrowserRouter>
        <SessionListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/workout session/i)).toBeInTheDocument();
    });
  });

  it("should filter sessions when filter tab is clicked", async () => {
    // Test implementation
  });

  it("should navigate to session detail when card is clicked", async () => {
    // Test implementation
  });
});
```

## E2E Tests (Playwright/Cypress)

### User Workflows

```typescript
// sessions-workflow.spec.ts

describe("Sessions Workflow", () => {
  it("should complete full session workflow", () => {
    // 1. Navigate to sessions page
    cy.visit("/sessions");

    // 2. Click "Start New Session"
    cy.findByRole("button", { name: /start new session/i }).click();

    // 3. Select a workout plan
    cy.findByRole("button", { name: /start/i }).first().click();

    // 4. Verify navigation to session detail
    cy.url().should("include", "/sessions/");

    // 5. Expand exercise accordion
    cy.findByText("Bench Press").click();

    // 6. Input set data
    cy.findByLabelText(/reps for set 1/i).type("10");
    cy.findByLabelText(/load for set 1/i).type("80");

    // 7. Add notes
    cy.findByLabelText(/notes/i).type("Felt strong today");

    // 8. Complete workout
    cy.findByRole("button", { name: /complete workout/i }).click();
    cy.findByRole("button", { name: /complete/i }).click();

    // 9. Verify navigation back to sessions list
    cy.url().should("equal", Cypress.config().baseUrl + "/sessions");
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for hooks and components
- **Integration Tests**: All major page flows
- **E2E Tests**: Critical user workflows
- **Accessibility Tests**: Automated axe-core checks

## Running Tests

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Conclusion

This testing guide provides a comprehensive testing strategy for the Sessions View. Once the testing framework is configured, these tests should be implemented to ensure code quality, prevent regressions, and maintain accessibility standards.
