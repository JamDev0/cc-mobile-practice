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
import { putMarker } from "@/storage/indexeddb/markerAdapter";
import { useReviewSession } from "./useReviewSession";
import type { Session, Marker } from "@/domain/models/types";

vi.mock("@/storage/indexeddb/gabaritoAdapter", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/storage/indexeddb/gabaritoAdapter")
  >();
  return {
    ...actual,
    putGabaritoEntry: vi.fn().mockRejectedValue(new Error("QuotaExceeded")),
  };
});

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
    id: "review-write-error",
    title: "Test",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "test.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 100,
    pdfSha256: "x",
    pageCount: 1,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
    ...overrides,
  };
}

function mkMarker(overrides: Partial<Marker> = {}): Marker {
  const now = Date.now();
  return {
    id: "m1",
    sessionId: "review-write-error",
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

async function seedSession() {
  const sessionId = "review-write-error";
  const db = await openDatabase();
  await putSession(db, mkSession());
  await putPdfBlob(db, sessionId, new Blob(["%PDF"], { type: "application/pdf" }));
  await putMarker(db, mkMarker());
  db.close();
}

describe("useReviewSession - DB write error surfacing", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("surfaces writeError when saveGabaritoEntry fails and clearWriteError clears it", async () => {
    await seedSession();

    const { result } = renderHook(() => useReviewSession("review-write-error"));

    await waitFor(() => {
      expect(result.current.session).not.toBeNull();
    });

    await act(async () => {
      await result.current.saveGabaritoEntry(1, "A");
    });

    expect(result.current.writeError).toBe("QuotaExceeded");

    act(() => {
      result.current.clearWriteError();
    });
    expect(result.current.writeError).toBeNull();
  });
});
