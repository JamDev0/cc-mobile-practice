/**
 * Review acceptance tests IRG-09, IRG-10.
 * Tap question number -> jump to marker; tap user/gabarito -> edit affordance.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putMarker } from "@/storage/indexeddb/markerAdapter";
import { putGabaritoEntry } from "@/storage/indexeddb/gabaritoAdapter";
import { ReviewScreen } from "./ReviewScreen";
import type { GabaritoEntry, Marker, Session } from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";

const DEFAULT_UI = {
  activeTab: "review" as const,
  handedness: "right" as const,
  zoomMode: "free" as const,
  lastViewedPage: 1,
};

function mkSession(overrides: Partial<Session> = {}): Session {
  const now = Date.now();
  return {
    id: "review-screen-test",
    title: "Test",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "test.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 100,
    pdfSha256: "test",
    pageCount: 2,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
    ...overrides,
  };
}

function mkMarker(overrides: Partial<Marker>): Marker {
  const now = Date.now();
  return {
    id: `m-${now}-${Math.random().toString(36).slice(2, 9)}`,
    sessionId: "review-screen-test",
    pageNumber: 1,
    xPct: 0.5,
    yPct: 0.5,
    questionNumber: 1,
    answerToken: "A",
    status: "valid",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mkGabarito(
  overrides: Partial<GabaritoEntry> & Pick<GabaritoEntry, "questionNumber" | "answerToken">
): GabaritoEntry {
  const now = Date.now();
  return {
    id: `g-${now}-${Math.random().toString(36).slice(2, 9)}`,
    sessionId: "review-screen-test",
    source: "import",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("ReviewScreen - IRG-09, IRG-10", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("IRG-09: Tap question number - calls onRequestJump with marker id and page", async () => {
    const sessionId = "review-screen-test";
    const session = mkSession({ id: sessionId });
    const marker = mkMarker({ id: "marker-1", questionNumber: 1, answerToken: "A", pageNumber: 2 });
    const gabarito = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, marker);
    await putGabaritoEntry(db, gabarito);
    db.close();

    const onRequestJump = vi.fn();
    render(
      <ReviewScreen sessionId={sessionId} onRequestJump={onRequestJump} />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const questionCell = screen.getByRole("button", { name: "1" });
    await userEvent.click(questionCell);

    expect(onRequestJump).toHaveBeenCalledTimes(1);
    expect(onRequestJump).toHaveBeenCalledWith({
      sessionId,
      markerId: "marker-1",
      pageNumber: 2,
    });
  });

  it("IRG-10: Tap user answer cell - calls onRequestJump with openEditMarkerId", async () => {
    const sessionId = "review-screen-test";
    const session = mkSession({ id: sessionId });
    const marker = mkMarker({ id: "marker-edit", questionNumber: 1, answerToken: "B" });
    const gabarito = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, marker);
    await putGabaritoEntry(db, gabarito);
    db.close();

    const onRequestJump = vi.fn();
    render(
      <ReviewScreen sessionId={sessionId} onRequestJump={onRequestJump} />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const container = document.body;
    const userCell = within(container).getByText("B");
    await userEvent.click(userCell);

    expect(onRequestJump).toHaveBeenCalledTimes(1);
    expect(onRequestJump).toHaveBeenCalledWith({
      sessionId,
      markerId: "marker-edit",
      pageNumber: 1,
      openEditMarkerId: "marker-edit",
    });
  });

  it("IRG-10: Tap gabarito cell - opens edit modal", async () => {
    const sessionId = "review-screen-test";
    const session = mkSession({ id: sessionId });
    const marker = mkMarker({ id: "m1", questionNumber: 1, answerToken: "B" });
    const gabarito = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, marker);
    await putGabaritoEntry(db, gabarito);
    db.close();

    const onRequestJump = vi.fn();
    const { container } = render(
      <ReviewScreen sessionId={sessionId} onRequestJump={onRequestJump} />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const { getByTestId } = within(container);
    const gabaritoCell = getByTestId("gabarito-Q1");
    await userEvent.click(gabaritoCell);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /edit gabarito/i })).toBeInTheDocument();
    });
  });
});
