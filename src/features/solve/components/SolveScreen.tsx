"use client";

import { useCallback, useMemo, useState } from "react";
import { PdfViewport } from "./PdfViewport";
import { MarkerOverlayLayer } from "./MarkerOverlayLayer";
import { RadialPickerPortal } from "./RadialPickerPortal";
import { EditMarkerSheet } from "./EditMarkerSheet";
import { SolveHeader } from "./SolveHeader";
import { useSolveSession } from "../hooks/useSolveSession";
import type { AnswerToken } from "@/domain/models/types";
import type { PendingMarker } from "../types";

interface SolveScreenProps {
  sessionId: string;
}

export function SolveScreen({ sessionId }: SolveScreenProps) {
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
    setHighlightedMarkerId,
    existingQuestionNumbers,
    pendingAnchor,
  } = useSolveSession(sessionId);

  const hasConflict = useMemo(
    () => markers.some((m) => m.status === "conflict"),
    [markers]
  );

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

  const renderMarkerOverlay = useCallback(
    (pageNumber: number, width: number, height: number) => {
      return (
        <MarkerOverlayLayer
          markers={markers}
          pageNumber={pageNumber}
          renderWidth={width}
          renderHeight={height}
          onMarkerClick={openEditMarker}
          highlightedMarkerId={highlightedMarkerId}
        />
      );
    },
    [markers, openEditMarker, highlightedMarkerId]
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
