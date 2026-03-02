"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PdfViewport } from "./PdfViewport";
import { MarkerOverlayLayer } from "./MarkerOverlayLayer";
import { RadialPickerPortal } from "./RadialPickerPortal";
import { EditMarkerSheet } from "./EditMarkerSheet";
import { useSolveSession } from "../hooks/useSolveSession";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import type { AnswerToken, Marker } from "@/domain/models/types";
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
    gabaritoByQuestion,
    reattachPdf,
    clearWriteError,
  } = useSolveSession(sessionId);

  const [reviewMode, setReviewMode] = useState(false);

  const [reattachError, setReattachError] = useState<string | null>(null);
  const reattachInputRef = useRef<HTMLInputElement>(null);

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

  const handleMarkerClick = useCallback(
    (marker: Marker) => {
      setActivePage(marker.pageNumber);
      setHighlightedMarkerId(marker.id);
      setScrollToPageNumber(marker.pageNumber);
      setScrollToMarkerId(marker.id);
      openEditMarker(marker);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    },
    [setActivePage, setHighlightedMarkerId, openEditMarker]
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
          onMarkerClick={handleMarkerClick}
          onMarkerDragEnd={handleMarkerDragEnd}
          getPageRect={getPageRect}
          highlightedMarkerId={highlightedMarkerId}
          reviewMode={reviewMode}
          gabaritoByQuestion={gabaritoByQuestion}
        />
      );
    },
    [
      markers,
      handleMarkerClick,
      handleMarkerDragEnd,
      highlightedMarkerId,
      reviewMode,
      gabaritoByQuestion,
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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-danger)", marginBottom: "0.75rem" }}>{error}</p>
        <Link
          href="/sessions"
          style={{
            color: "var(--color-accent)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (sessionNotFound) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
          Session not found.
        </p>
        <Link
          href="/sessions"
          style={{
            color: "var(--color-accent)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Loading session...
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
            background: "var(--color-warning-bg)",
            borderBottom: `1px solid var(--color-warning-border)`,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: "var(--color-warning-text)" }}>
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
                background: "var(--color-accent)",
                color: "var(--color-accent-text)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              Reattach PDF
            </button>
          </div>
          {reattachError && (
            <p style={{ margin: 0, color: "var(--color-danger)", fontSize: "0.875rem" }}>
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
            background: "var(--color-danger-soft)",
            color: "var(--color-danger)",
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
            background: "var(--color-warning-bg)",
            color: "var(--color-warning-text)",
            fontSize: "0.875rem",
          }}
        >
          {jumpError}
        </div>
      )}
      <button
        type="button"
        onClick={() => setReviewMode((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 90,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: reviewMode ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
          background: reviewMode ? "var(--color-accent)" : "var(--color-surface)",
          color: reviewMode ? "var(--color-accent-text)" : "var(--color-text-muted)",
          cursor: "pointer",
          boxShadow: "var(--shadow-lg)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-family)",
        }}
        aria-label={reviewMode ? "Hide gabarito answers" : "Show gabarito answers"}
        aria-pressed={reviewMode}
      >
        Review
      </button>
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
        disableScroll={pendingMarker != null}
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
