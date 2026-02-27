/**
 * Spec 12 (In-session switch navigation) acceptance tests.
 * SSN-01: Switch affordance visible on session route
 * SSN-02: Activate switch action → route changes to /sessions (e2e)
 * SSN-03: Keyboard activation works (e2e)
 * SSN-04: Session-not-found route → switch affordance still available
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { deleteDB } from "idb";
import SessionPage from "./page";

const DB_NAME = "mobile-practice-db";

const mockUseParams = vi.fn(() => ({ sessionId: "test-session-id" }));

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

describe("Session page - Spec 12 (SSN) In-session switch navigation", () => {
  beforeEach(async () => {
    cleanup();
    await deleteDB(DB_NAME);
    mockUseParams.mockReturnValue({ sessionId: "test-session-id" });
  });

  it("SSN-01: Open session route - switch affordance is visible", async () => {
    render(<SessionPage />);

    await waitFor(() => {
      const link = screen.getByTestId("switch-session-link-header");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/sessions");
      expect(link).toHaveAccessibleName("Switch session");
    });
  });

  it("SSN-04: Session-not-found route - switch affordance still available", async () => {
    mockUseParams.mockReturnValue({ sessionId: "nonexistent-session" });

    render(<SessionPage />);

    const link = await screen.findByTestId("switch-session-link-header", {}, {
      timeout: 3000,
    });
    expect(link).toHaveAttribute("href", "/sessions");
  });

  it("SSN-03: Switch link has minimum 44x44 touch target", async () => {
    render(<SessionPage />);

    const link = await screen.findByTestId("switch-session-link-header", {}, {
      timeout: 3000,
    });

    const style = window.getComputedStyle(link);
    const minWidth = parseFloat(style.minWidth);
    const minHeight = parseFloat(style.minHeight);
    expect(minWidth).toBeGreaterThanOrEqual(44);
    expect(minHeight).toBeGreaterThanOrEqual(44);
  });
});
