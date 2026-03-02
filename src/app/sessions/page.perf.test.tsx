/**
 * NFR-001: Verifies sessions page calls markViewInteractive when list completes.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { deleteDB } from "idb";
import {
  getMeasurements,
  clearMeasurements,
} from "@/shared/utils/performanceProfiler";
import SessionsPage from "./page";

const DB_NAME = "mobile-practice-db";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SessionsPage - NFR-001 instrumentation", () => {
  beforeEach(async () => {
    clearMeasurements();
    await deleteDB(DB_NAME);
  });

  it("calls markViewInteractive('sessions') when session list finishes loading", async () => {
    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const measurements = getMeasurements();
    const sessionsMeasurement = measurements.find((m) => m.viewName === "sessions");
    expect(sessionsMeasurement).toBeDefined();
    expect(sessionsMeasurement?.durationMs).toBeGreaterThanOrEqual(0);
  });
});
