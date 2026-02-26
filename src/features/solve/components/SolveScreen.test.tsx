/**
 * Solve acceptance tests S-UI-04: Jump from review question number -> correct page and marker highlighted.
 * Uses fake-indexeddb; PdfViewport mocked to avoid react-pdf in jsdom.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import { putMarker } from "@/storage/indexeddb/markerAdapter";
import { SolveScreen } from "./SolveScreen";
import type { Marker, Session } from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";

const DEFAULT_UI = {
  activeTab: "solve" as const,
  handedness: "right" as const,
  zoomMode: "free" as const,
  lastViewedPage: 1,
};

vi.mock("./PdfViewport", () => {
  const React = require("react");
  return {
    PdfViewport: (props: Record<string, unknown>) =>
      React.createElement("div", {
        "data-testid": "pdf-viewport-mock",
        "data-scroll-to-page": String(props.scrollToPageNumber ?? ""),
        "data-highlighted-marker-id": String(props.highlightedMarkerId ?? ""),
      }),
  };
});

async function seedSessionWithMarker(
  sessionId: string,
  marker: Marker
) {
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    title: "Jump Test",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "test.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 100,
    pdfSha256: "test",
    pageCount: 2,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
  };
  const db = await openDatabase();
  await putSession(db, session);
  await putPdfBlob(db, sessionId, new Blob(["%PDF-1.4 fake"], { type: "application/pdf" }));
  await putMarker(db, marker);
  db.close();
}

describe("SolveScreen - S-UI-04 jump-to-marker", () => {
  beforeEach(async () => {
    cleanup();
    await deleteDB(DB_NAME);
  });

  it("S-UI-04: Jump request scrolls to correct page and highlights marker", async () => {
    const sessionId = "jump-test-session";
    const marker: Marker = {
      id: "marker-jump-1",
      sessionId,
      pageNumber: 2,
      xPct: 0.5,
      yPct: 0.5,
      questionNumber: 1,
      answerToken: "A",
      status: "valid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await seedSessionWithMarker(sessionId, marker);

    const onJumpRequestConsumed = vi.fn();
    render(
      <SolveScreen
        sessionId={sessionId}
        jumpRequest={{
          sessionId,
          markerId: marker.id,
          pageNumber: 2,
        }}
        onJumpRequestConsumed={onJumpRequestConsumed}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      const viewport = screen.getByTestId("pdf-viewport-mock");
      expect(viewport).toHaveAttribute("data-scroll-to-page", "2");
      expect(viewport).toHaveAttribute("data-highlighted-marker-id", marker.id);
    });

    expect(onJumpRequestConsumed).toHaveBeenCalled();
  });

  it("S-UI-04: Marker missing shows warning toast and consumes request", async () => {
    const sessionId = "jump-missing-session";
    const session: Session = {
      id: sessionId,
      title: "Empty",
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    await putPdfBlob(db, sessionId, new Blob(["%PDF-1.4"], { type: "application/pdf" }));
    db.close();

    const onJumpRequestConsumed = vi.fn();
    render(
      <SolveScreen
        sessionId={sessionId}
        jumpRequest={{
          sessionId,
          markerId: "non-existent-marker",
          pageNumber: 1,
        }}
        onJumpRequestConsumed={onJumpRequestConsumed}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText("Marker not found")).toBeInTheDocument();
    });

    expect(onJumpRequestConsumed).toHaveBeenCalled();
  });
});
