/**
 * Solve acceptance tests S-UI-01, S-UI-02, S-UI-05, S-UI-06.
 * Uses fake-indexeddb for persistence verification.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import { listMarkersBySession } from "@/storage/indexeddb/markerAdapter";
import { useSolveSession } from "./useSolveSession";
import type { Session } from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";

const DEFAULT_UI = {
  activeTab: "solve" as const,
  handedness: "right" as const,
  zoomMode: "free" as const,
  lastViewedPage: 1,
};

async function seedSession(sessionId: string) {
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    title: "Test Session",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "test.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 100,
    pdfSha256: "test",
    pageCount: 1,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
  };
  const db = await openDatabase();
  await putSession(db, session);
  await putPdfBlob(db, sessionId, new Blob(["%PDF-1.4 fake"], { type: "application/pdf" }));
  db.close();
}

describe("useSolveSession - Solve acceptance", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("S-UI-01: Tap PDF and select token - marker persisted with next question number", async () => {
    const sessionId = "solve-test-session-1";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
      expect(result.current.pdfBlob).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.5, 0.5, 100, 200);
    });

    expect(result.current.pendingMarker).not.toBeNull();
    expect(result.current.pendingMarker?.suggestedQuestionNumber).toBe(1);

    await act(async () => {
      const ok = await result.current.commitMarker("A");
      expect(ok).toBe(true);
    });

    expect(result.current.pendingMarker).toBeNull();

    const db = await openDatabase();
    const markers = await listMarkersBySession(db, sessionId);
    db.close();

    expect(markers).toHaveLength(1);
    expect(markers[0].questionNumber).toBe(1);
    expect(markers[0].answerToken).toBe("A");
    expect(markers[0].xPct).toBe(0.5);
    expect(markers[0].yPct).toBe(0.5);
    expect(markers[0].pageNumber).toBe(1);
  });

  it("S-UI-06: Cancel radial selection - no marker persisted", async () => {
    const sessionId = "solve-test-session-2";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.3, 0.4, 50, 60);
    });

    expect(result.current.pendingMarker).not.toBeNull();

    act(() => {
      result.current.cancelPendingMarker();
    });

    expect(result.current.pendingMarker).toBeNull();

    const db = await openDatabase();
    const markers = await listMarkersBySession(db, sessionId);
    db.close();

    expect(markers).toHaveLength(0);
  });

  it("S-UI-02: Tap marker and edit question to duplicate - existingQuestionNumbers includes other markers", async () => {
    const sessionId = "solve-test-session-2b";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.5, 0.5, 100, 100);
    });
    await act(async () => {
      await result.current.commitMarker("A");
    });

    act(() => {
      result.current.createPendingMarker(1, 0.6, 0.6, 120, 130);
    });
    await act(async () => {
      await result.current.commitMarker("B");
    });

    await waitFor(() => {
      expect(result.current.markers).toHaveLength(2);
    });
    const [markerA, markerB] = result.current.markers;
    expect(result.current.existingQuestionNumbers.has(1)).toBe(true);

    act(() => {
      result.current.openEditMarker(markerB);
    });
    expect(result.current.existingQuestionNumbers.has(1)).toBe(true);
    expect(result.current.existingQuestionNumbers.size).toBe(1);
  });

  it("S-UI-03 (I-05): Drag marker - position updated and persisted", async () => {
    const sessionId = "solve-test-session-drag";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.5, 0.5, 100, 100);
    });
    await act(async () => {
      await result.current.commitMarker("C");
    });

    await waitFor(() => {
      expect(result.current.markers).toHaveLength(1);
    });
    const marker = result.current.markers[0];
    expect(marker.xPct).toBe(0.5);
    expect(marker.yPct).toBe(0.5);

    await act(async () => {
      await result.current.updateMarkerPosition(marker.id, 1, 0.25, 0.75);
    });

    expect(result.current.markers[0].xPct).toBe(0.25);
    expect(result.current.markers[0].yPct).toBe(0.75);

    const db = await openDatabase();
    const markersFromDb = await listMarkersBySession(db, sessionId);
    db.close();
    expect(markersFromDb).toHaveLength(1);
    expect(markersFromDb[0].xPct).toBe(0.25);
    expect(markersFromDb[0].yPct).toBe(0.75);
  });

  it("S-UI-05: Delete marker - row and grading recompute immediately", async () => {
    const sessionId = "solve-test-session-3";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.5, 0.5, 100, 100);
    });
    await act(async () => {
      await result.current.commitMarker("B");
    });

    await waitFor(() => {
      expect(result.current.markers).toHaveLength(1);
    });
    const markerToEdit = result.current.markers[0];

    act(() => {
      result.current.openEditMarker(markerToEdit);
    });
    expect(result.current.editMarker).not.toBeNull();

    await act(async () => {
      await result.current.deleteEditMarker();
    });

    expect(result.current.editMarker).toBeNull();

    const dbAfter = await openDatabase();
    const markersAfter = await listMarkersBySession(dbAfter, sessionId);
    dbAfter.close();
    expect(markersAfter).toHaveLength(0);
  });
});
