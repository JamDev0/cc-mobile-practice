/**
 * Review acceptance tests IRG-06, IRG-07, IRG-08.
 * Verifies useReviewSession loads data and computes grading snapshot correctly.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putMarker } from "@/storage/indexeddb/markerAdapter";
import { putGabaritoEntry } from "@/storage/indexeddb/gabaritoAdapter";
import { useReviewSession } from "./useReviewSession";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
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
    id: "review-test-session",
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
    sessionId: "review-test-session",
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
    sessionId: "review-test-session",
    source: "import",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("useReviewSession - Review acceptance", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("IRG-06: Conflict rows present - excluded from score and snapshot contains conflict status", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const m1 = mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" });
    const m2 = mkMarker({ id: "m2", questionNumber: 1, answerToken: "C" });
    const g = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, m1);
    await putMarker(db, m2);
    await putGabaritoEntry(db, g);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    const snap = result.current.snapshot!;
    expect(snap.conflictExcludedCount).toBe(1);
    const conflictRow = snap.rows.find((r) => r.status === "conflict");
    expect(conflictRow).toBeDefined();
    expect(conflictRow?.questionNumber).toBe(1);
    expect(conflictRow?.userMarkers).toHaveLength(2);
  });

  it("IRG-07: Missing gabarito rows - not gradable status shown", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const m = mkMarker({ id: "m1", questionNumber: 5, answerToken: "B" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, m);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    const snap = result.current.snapshot!;
    expect(snap.notGradableCount).toBe(1);
    const ngRow = snap.rows.find((r) => r.status === "not_gradable");
    expect(ngRow).toBeDefined();
    expect(ngRow?.questionNumber).toBe(5);
  });

  it("IRG-08: Missing user rows - blank/wrong counted", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const g = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putGabaritoEntry(db, g);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    const snap = result.current.snapshot!;
    expect(snap.wrongCount).toBe(1);
    expect(snap.blankCount).toBe(1);
    const blankRow = snap.rows.find((r) => r.status === "blank");
    expect(blankRow).toBeDefined();
    expect(blankRow?.questionNumber).toBe(1);
  });

  it("IRG-10: Save gabarito entry - snapshot recomputes", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const m = mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" });

    const db = await openDatabase();
    await putSession(db, session);
    await putMarker(db, m);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    const snapBefore = result.current.snapshot!;
    expect(snapBefore.notGradableCount).toBe(1);

    await act(async () => {
      await result.current.saveGabaritoEntry(1, "A");
    });

    await waitFor(() => {
      const snap = result.current.snapshot!;
      expect(snap.correctCount).toBe(1);
      expect(snap.notGradableCount).toBe(0);
    });
  });
});
