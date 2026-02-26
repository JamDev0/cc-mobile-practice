/**
 * Review acceptance tests IRG-01 through IRG-10.
 * Verifies useReviewSession loads data, import workflow, and grading snapshot correctly.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putMarker } from "@/storage/indexeddb/markerAdapter";
import {
  putGabaritoEntry,
  listGabaritoEntriesBySession,
} from "@/storage/indexeddb/gabaritoAdapter";
import { useReviewSession } from "./useReviewSession";
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

  it("IRG-01: Import valid Format A - all entries persisted correctly", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });

    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    let report = null;
    await act(async () => {
      report = await result.current.importGabarito("1A,2B,3C", {
        format: "A",
        strategy: "replace",
      });
    });

    expect(report).not.toBeNull();
    expect(report?.importedCount).toBe(3);
    expect(report?.skippedCount).toBe(0);

    const db2 = await openDatabase();
    const entries = await listGabaritoEntriesBySession(db2, sessionId);
    db2.close();

    expect(entries).toHaveLength(3);
    const byQ = Object.fromEntries(entries.map((e) => [e.questionNumber, e.answerToken]));
    expect(byQ[1]).toBe("A");
    expect(byQ[2]).toBe("B");
    expect(byQ[3]).toBe("C");
  });

  it("IRG-02: Import valid Format B with start=5 - first entry maps to Q5", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });

    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    let report = null;
    await act(async () => {
      report = await result.current.importGabarito("A,B,D,A,C", {
        format: "B",
        strategy: "replace",
        startQuestionNumber: 5,
      });
    });

    expect(report?.importedCount).toBe(5);

    const db2 = await openDatabase();
    const entries = await listGabaritoEntriesBySession(db2, sessionId);
    db2.close();

    expect(entries).toHaveLength(5);
    const byQ = Object.fromEntries(entries.map((e) => [e.questionNumber, e.answerToken]));
    expect(byQ[5]).toBe("A");
    expect(byQ[9]).toBe("C");
  });

  it("IRG-03: Import mixed valid/invalid - valid entries imported, warnings shown", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });

    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    let report = null;
    await act(async () => {
      report = await result.current.importGabarito("1A,1X,2B,3Z,4C", {
        format: "A",
        strategy: "replace",
      });
    });

    expect(report?.importedCount).toBe(3);
    expect(report?.skippedCount).toBe(2);
    expect(report?.warnings.filter((w) => w.reason === "INVALID_TOKEN")).toHaveLength(2);

    const db2 = await openDatabase();
    const entries = await listGabaritoEntriesBySession(db2, sessionId);
    db2.close();
    expect(entries).toHaveLength(3);
  });

  it("IRG-04: Replace import over existing key - previous entries removed", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const g1 = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });
    const g2 = mkGabarito({ id: "g2", questionNumber: 2, answerToken: "B" });

    const db = await openDatabase();
    await putSession(db, session);
    await putGabaritoEntry(db, g1);
    await putGabaritoEntry(db, g2);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    await act(async () => {
      await result.current.importGabarito("3C,4D", {
        format: "A",
        strategy: "replace",
      });
    });

    const db2 = await openDatabase();
    const entries = await listGabaritoEntriesBySession(db2, sessionId);
    db2.close();
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.questionNumber >= 3)).toBe(true);
  });

  it("IRG-05: Merge import over existing key - overlaps updated, others preserved", async () => {
    const sessionId = "review-test-session";
    const session = mkSession({ id: sessionId });
    const g1 = mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" });
    const g2 = mkGabarito({ id: "g2", questionNumber: 2, answerToken: "B" });

    const db = await openDatabase();
    await putSession(db, session);
    await putGabaritoEntry(db, g1);
    await putGabaritoEntry(db, g2);
    db.close();

    const { result } = renderHook(() => useReviewSession(sessionId));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    await act(async () => {
      await result.current.importGabarito("1C,3D", {
        format: "A",
        strategy: "merge",
      });
    });

    const db2 = await openDatabase();
    const entries = await listGabaritoEntriesBySession(db2, sessionId);
    db2.close();
    expect(entries).toHaveLength(3);
    const byQ = Object.fromEntries(entries.map((e) => [e.questionNumber, e.answerToken]));
    expect(byQ[1]).toBe("C");
    expect(byQ[2]).toBe("B");
    expect(byQ[3]).toBe("D");
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
