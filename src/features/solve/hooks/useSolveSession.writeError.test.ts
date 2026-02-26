/**
 * DB write error surfacing tests (WP-07 Hardening).
 * Verifies that IndexedDB write failures are surfaced to the user.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import { listMarkersBySession } from "@/storage/indexeddb/markerAdapter";
import { useSolveSession } from "./useSolveSession";
import type { Session } from "@/domain/models/types";

vi.mock("@/storage/indexeddb/markerAdapter", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/storage/indexeddb/markerAdapter")
  >();
  return {
    ...actual,
    putMarker: vi.fn().mockRejectedValue(new Error("QuotaExceeded")),
  };
});

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

describe("useSolveSession - DB write error surfacing", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("surfaces writeError when commitMarker fails and clearWriteError clears it", async () => {
    const sessionId = "solve-write-error-1";
    await seedSession(sessionId);

    const { result } = renderHook(() => useSolveSession(sessionId));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    act(() => {
      result.current.createPendingMarker(1, 0.5, 0.5, 100, 200);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.commitMarker("A");
    });

    expect(ok).toBe(false);
    expect(result.current.writeError).toBe("QuotaExceeded");

    act(() => {
      result.current.clearWriteError();
    });
    expect(result.current.writeError).toBeNull();
  });
});
