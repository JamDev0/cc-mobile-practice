/**
 * RDA-04: IndexedDB delete failure surfaces write error banner.
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

vi.mock("@/storage/indexeddb/markerAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/storage/indexeddb/markerAdapter")>();
  return {
    ...actual,
    deleteMarker: vi.fn().mockRejectedValue(new Error("IndexedDB delete failed")),
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
    id: "rda04-test",
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
    sessionId: "rda04-test",
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
    sessionId: "rda04-test",
    source: "import",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("ReviewScreen - RDA-04 delete error", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("RDA-04: IndexedDB delete failure - write error banner shown", async () => {
    const sessionId = "rda04-test";
    const session = mkSession({ id: sessionId });
    const marker = mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" });
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
    const deleteBtn = getByTestId("delete-Q1");
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /delete user answer confirmation/i })).toBeInTheDocument();
    });

    const deleteConfirmBtn = screen.getByRole("button", { name: /^Delete$/ });
    await userEvent.click(deleteConfirmBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/IndexedDB delete failed|Failed to delete marker/);
  });
});
