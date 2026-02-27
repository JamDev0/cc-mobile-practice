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
  const MockPdfViewport = (props: Record<string, unknown>) => {
    React.useEffect(() => {
      if (
        props.scrollToPageNumber != null &&
        typeof props.onScrollAttempted === "function"
      ) {
        (props.onScrollAttempted as (success: boolean) => void)(true);
      }
    }, [props.scrollToPageNumber, props.onScrollAttempted]);
    return React.createElement("div", {
      "data-testid": "pdf-viewport-mock",
      "data-scroll-to-page": String(props.scrollToPageNumber ?? ""),
      "data-scroll-to-marker-id": String(props.scrollToMarkerId ?? ""),
      "data-highlighted-marker-id": String(props.highlightedMarkerId ?? ""),
    });
  };
  return { PdfViewport: MockPdfViewport };
});

async function seedSessionWithMarker(
  sessionId: string,
  marker: Marker,
  pageCount = 2
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
    pageCount,
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

  it("S-UI-04 / RJT-03: Marker missing shows warning toast and consumes request", async () => {
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

  it("RJT-02: Jump with openEditMarkerId opens edit sheet for target marker", async () => {
    const sessionId = "jump-edit-session";
    const marker: Marker = {
      id: "marker-to-edit",
      sessionId,
      pageNumber: 1,
      xPct: 0.5,
      yPct: 0.5,
      questionNumber: 1,
      answerToken: "B",
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
          pageNumber: 1,
          openEditMarkerId: marker.id,
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
      expect(screen.getByRole("heading", { name: "Edit marker" })).toBeInTheDocument();
      expect(screen.getByDisplayValue("B")).toBeInTheDocument();
    });

    expect(onJumpRequestConsumed).toHaveBeenCalled();
  });

  it("RJT-04: Repeated jumps - latest request wins", async () => {
    const sessionId = "jump-repeat-session";
    const marker1: Marker = {
      id: "m1",
      sessionId,
      pageNumber: 1,
      xPct: 0.5,
      yPct: 0.5,
      questionNumber: 1,
      answerToken: "A",
      status: "valid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const marker2: Marker = {
      id: "m2",
      sessionId,
      pageNumber: 2,
      xPct: 0.5,
      yPct: 0.5,
      questionNumber: 2,
      answerToken: "B",
      status: "valid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const db = await openDatabase();
    const now = Date.now();
    const session: Session = {
      id: sessionId,
      title: "Jump Repeat",
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
    await putSession(db, session);
    await putPdfBlob(db, sessionId, new Blob(["%PDF-1.4 fake"], { type: "application/pdf" }));
    await putMarker(db, marker1);
    await putMarker(db, marker2);
    db.close();

    const onJumpRequestConsumed = vi.fn();
    const { rerender } = render(
      <SolveScreen
        sessionId={sessionId}
        jumpRequest={{
          sessionId,
          markerId: marker1.id,
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
      const viewport = screen.getByTestId("pdf-viewport-mock");
      expect(viewport).toHaveAttribute("data-scroll-to-page", "1");
      expect(viewport).toHaveAttribute("data-scroll-to-marker-id", marker1.id);
      expect(viewport).toHaveAttribute("data-highlighted-marker-id", marker1.id);
    });

    onJumpRequestConsumed.mockClear();

    rerender(
      <SolveScreen
        sessionId={sessionId}
        jumpRequest={{
          sessionId,
          markerId: marker2.id,
          pageNumber: 2,
        }}
        onJumpRequestConsumed={onJumpRequestConsumed}
      />
    );

    await waitFor(() => {
      const viewport = screen.getByTestId("pdf-viewport-mock");
      expect(viewport).toHaveAttribute("data-scroll-to-page", "2");
      expect(viewport).toHaveAttribute("data-scroll-to-marker-id", marker2.id);
      expect(viewport).toHaveAttribute("data-highlighted-marker-id", marker2.id);
    });

    expect(onJumpRequestConsumed).toHaveBeenCalled();
  });

  it("RJT: Jump to last-page marker keeps marker as scroll target", async () => {
    const sessionId = "jump-end-page-session";
    const marker: Marker = {
      id: "m-end",
      sessionId,
      pageNumber: 30,
      xPct: 0.2,
      yPct: 0.8,
      questionNumber: 30,
      answerToken: "E",
      status: "valid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await seedSessionWithMarker(sessionId, marker, 30);

    const onJumpRequestConsumed = vi.fn();
    render(
      <SolveScreen
        sessionId={sessionId}
        jumpRequest={{
          sessionId,
          markerId: marker.id,
          pageNumber: 30,
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
      expect(viewport).toHaveAttribute("data-scroll-to-page", "30");
      expect(viewport).toHaveAttribute("data-scroll-to-marker-id", marker.id);
      expect(viewport).toHaveAttribute("data-highlighted-marker-id", marker.id);
    });
  });
});
