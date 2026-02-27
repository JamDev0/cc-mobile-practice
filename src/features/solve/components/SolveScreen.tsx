"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PdfViewport } from "./PdfViewport";
import { MarkerOverlayLayer } from "./MarkerOverlayLayer";
import { RadialPickerPortal } from "./RadialPickerPortal";
import { EditMarkerSheet } from "./EditMarkerSheet";
import { SolveHeader } from "./SolveHeader";
import { useSolveSession } from "../hooks/useSolveSession";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import type { AnswerToken } from "@/domain/models/types";
import type { PendingMarker } from "../types";
import type { JumpRequest } from "../types";

const HIGHLIGHT_PULSE_MS = 1000;

type PendingPointer = {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
};

interface SolveScreenProps {
  sessionId: string;
  jumpRequest?: JumpRequest | null;
  onJumpRequestConsumed?: () => void;
}

export function SolveScreen({
  sessionId,
  jumpRequest = null,
  onJumpRequestConsumed,
}: SolveScreenProps) {
  const {
    session,
    pdfBlob,
    markers,
    pageCount,
    pendingMarker,
    editMarker,
    highlightedMarkerId,
    activePage,
    error,
    writeError,
    sessionNotFound,
    setPageCount,
    setActivePage,
    createPendingMarker,
    commitMarker,
    cancelPendingMarker,
    openEditMarker,
    closeEditMarker,
    saveEditMarker,
    deleteEditMarker,
    updateMarkerPosition,
    setHighlightedMarkerId,
    existingQuestionNumbers,
    pendingAnchor,
    reattachPdf,
    clearWriteError,
  } = useSolveSession(sessionId);

  const [reattachError, setReattachError] = useState<string | null>(null);
  const reattachInputRef = useRef<HTMLInputElement>(null);

  const hasConflict = useMemo(
    () => markers.some((m) => m.status === "conflict"),
    [markers]
  );

  const [scrollToPageNumber, setScrollToPageNumber] = useState<number | null>(
    null
  );
  const [scrollToMarkerId, setScrollToMarkerId] = useState<string | null>(null);
  const [jumpError, setJumpError] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingPointer, setPendingPointer] = useState<PendingPointer | null>(null);

  useEffect(() => {
    if (!pendingMarker) setPendingPointer(null);
  }, [pendingMarker]);

  useEffect(() => {
    if (session && !sessionNotFound) {
      markViewInteractive("solve");
    }
  }, [session, sessionNotFound]);

  useEffect(() => {
    if (
      !jumpRequest ||
      jumpRequest.sessionId !== sessionId ||
      !onJumpRequestConsumed ||
      !session
    )
      return;
    // Session load includes markers; avoid consuming before load completes
    const marker = markers.find((m) => m.id === jumpRequest.markerId);
    if (!marker) {
      setJumpError("Marker not found");
      onJumpRequestConsumed?.();
      const t = setTimeout(() => setJumpError(null), 3000);
      return () => clearTimeout(t);
    }

    setActivePage(jumpRequest.pageNumber);
    setHighlightedMarkerId(jumpRequest.markerId);
    setScrollToPageNumber(jumpRequest.pageNumber);
    setScrollToMarkerId(jumpRequest.markerId);
    if (jumpRequest.openEditMarkerId && marker.id === jumpRequest.openEditMarkerId) {
      openEditMarker(marker);
    }
    // Per spec 09 §4.3: consume only after scroll attempt (handled in onScrollAttempted)

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMarkerId(null);
      setScrollToPageNumber(null);
      setScrollToMarkerId(null);
      highlightTimeoutRef.current = null;
    }, HIGHLIGHT_PULSE_MS);

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [
    jumpRequest,
    sessionId,
    session,
    markers,
    onJumpRequestConsumed,
    setActivePage,
    setHighlightedMarkerId,
    openEditMarker,
  ]);

  const handleScrollAttempted = useCallback(
    (success: boolean) => {
      if (!success) setJumpError("Could not scroll to target");
      onJumpRequestConsumed?.();
    },
    [onJumpRequestConsumed]
  );

  const handlePageTap = useCallback(
    (
      pageNumber: number,
      xPct: number,
      yPct: number,
      clientX: number,
      clientY: number,
      pointerId: number,
      pointerType: string
    ) => {
      setPendingPointer({ pointerId, pointerType, clientX, clientY });
      createPendingMarker(pageNumber, xPct, yPct, clientX, clientY);
    },
    [createPendingMarker]
  );

  const handlePageCountKnown = useCallback(
    (numPages: number) => {
      setPageCount(numPages);
    },
    [setPageCount]
  );

  const handleRadialSelect = useCallback(
    async (token: AnswerToken) => {
      await commitMarker(token);
    },
    [commitMarker]
  );

  const handleMarkerDragEnd = useCallback(
    (markerId: string, pageNumber: number, xPct: number, yPct: number) => {
      updateMarkerPosition(markerId, pageNumber, xPct, yPct);
    },
    [updateMarkerPosition]
  );

  const renderMarkerOverlay = useCallback(
    (
      pageNumber: number,
      width: number,
      height: number,
      getPageRect: () => DOMRect | undefined
    ) => {
      return (
        <MarkerOverlayLayer
          markers={markers}
          pageNumber={pageNumber}
          renderWidth={width}
          renderHeight={height}
          onMarkerClick={openEditMarker}
          onMarkerDragEnd={handleMarkerDragEnd}
          getPageRect={getPageRect}
          highlightedMarkerId={highlightedMarkerId}
        />
      );
    },
    [
      markers,
      openEditMarker,
      handleMarkerDragEnd,
      highlightedMarkerId,
    ]
  );

  const handleReattachFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setReattachError(null);
      const result = await reattachPdf(file);
      e.target.value = "";
      if (!result.ok) {
        setReattachError(result.error ?? "Failed to reattach");
      }
    },
    [reattachPdf]
  );

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "red" }}>{error}</p>
        <Link href="/sessions" style={{ color: "#0070f3", marginTop: "0.5rem", display: "inline-block" }}>
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (sessionNotFound) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Session not found.</p>
        <Link href="/sessions" style={{ color: "#0070f3", marginTop: "0.5rem", display: "inline-block" }}>
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Loading session...</p>
      </div>
    );
  }

  const pdfBlobMissing = session && !pdfBlob;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {pdfBlobMissing && (
        <div
          role="alert"
          style={{
            padding: "1rem",
            background: "#fef7e0",
            borderBottom: "1px solid #f9a825",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: 500, color: "#b06000" }}>
            PDF file is missing. Please reattach it to continue.
          </p>
          <div>
            <input
              ref={reattachInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleReattachFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => reattachInputRef.current?.click()}
              style={{
                padding: "0.5rem 1rem",
                background: "#b06000",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reattach PDF
            </button>
          </div>
          {reattachError && (
            <p style={{ margin: 0, color: "#dc2626", fontSize: "0.875rem" }}>
              {reattachError}
            </p>
          )}
        </div>
      )}
      {writeError && (
        <div
          role="alert"
          style={{
            padding: "0.5rem 1rem",
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <span>{writeError}</span>
          <button
            type="button"
            onClick={clearWriteError}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              fontSize: "1rem",
              color: "inherit",
              lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {jumpError && (
        <div
          role="alert"
          style={{
            padding: "0.5rem 1rem",
            background: "#fef3c7",
            color: "#92400e",
            fontSize: "0.875rem",
          }}
        >
          {jumpError}
        </div>
      )}
      <SolveHeader
        sessionTitle={session.title}
        currentPage={activePage}
        pageCount={pageCount}
        hasConflict={hasConflict}
      />
      <PdfViewport
        pdfBlob={pdfBlob}
        pageCount={pageCount}
        onPageCountKnown={handlePageCountKnown}
        onPageTap={handlePageTap}
        renderMarkerOverlay={renderMarkerOverlay}
        pendingMarker={pendingMarker}
        activePage={activePage}
        onActivePageChange={setActivePage}
        highlightedMarkerId={highlightedMarkerId}
        scrollToPageNumber={scrollToPageNumber}
        scrollToMarkerId={scrollToMarkerId}
        onScrollAttempted={handleScrollAttempted}
      />
      {pendingMarker && pendingAnchor && (
        <RadialPickerPortal
          anchorX={pendingAnchor.x}
          anchorY={pendingAnchor.y}
          questionNumber={pendingMarker.suggestedQuestionNumber}
          initialPointer={pendingPointer ?? undefined}
          onSelect={handleRadialSelect}
          onCancel={cancelPendingMarker}
        />
      )}
      {editMarker && (
        <EditMarkerSheet
          marker={editMarker}
          existingQuestionNumbers={existingQuestionNumbers}
          onSave={saveEditMarker}
          onDelete={deleteEditMarker}
          onClose={closeEditMarker}
        />
      )}
    </div>
  );
}
