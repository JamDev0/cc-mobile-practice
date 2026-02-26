"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PdfViewport } from "./PdfViewport";
import { MarkerOverlayLayer } from "./MarkerOverlayLayer";
import { RadialPickerPortal } from "./RadialPickerPortal";
import { EditMarkerSheet } from "./EditMarkerSheet";
import { SolveHeader } from "./SolveHeader";
import { useSolveSession } from "../hooks/useSolveSession";
import type { AnswerToken } from "@/domain/models/types";
import type { PendingMarker } from "../types";
import type { JumpRequest } from "../types";

const HIGHLIGHT_PULSE_MS = 1000;

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
  } = useSolveSession(sessionId);

  const hasConflict = useMemo(
    () => markers.some((m) => m.status === "conflict"),
    [markers]
  );

  const [scrollToPageNumber, setScrollToPageNumber] = useState<number | null>(
    null
  );
  const [jumpError, setJumpError] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (
      !jumpRequest ||
      jumpRequest.sessionId !== sessionId ||
      !onJumpRequestConsumed
    )
      return;

    const marker = markers.find((m) => m.id === jumpRequest.markerId);
    if (!marker) {
      setJumpError("Marker not found");
      onJumpRequestConsumed();
      const t = setTimeout(() => setJumpError(null), 3000);
      return () => clearTimeout(t);
    }

    setActivePage(jumpRequest.pageNumber);
    setHighlightedMarkerId(jumpRequest.markerId);
    setScrollToPageNumber(jumpRequest.pageNumber);
    if (jumpRequest.openEditMarkerId && marker.id === jumpRequest.openEditMarkerId) {
      openEditMarker(marker);
    }
    onJumpRequestConsumed();

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMarkerId(null);
      setScrollToPageNumber(null);
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
    markers,
    onJumpRequestConsumed,
    setActivePage,
    setHighlightedMarkerId,
    openEditMarker,
  ]);

  const handlePageTap = useCallback(
    (
      pageNumber: number,
      xPct: number,
      yPct: number,
      clientX: number,
      clientY: number
    ) => {
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

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "red" }}>{error}</p>
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
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
      />
      {pendingMarker && pendingAnchor && (
        <RadialPickerPortal
          anchorX={pendingAnchor.x}
          anchorY={pendingAnchor.y}
          questionNumber={pendingMarker.suggestedQuestionNumber}
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
