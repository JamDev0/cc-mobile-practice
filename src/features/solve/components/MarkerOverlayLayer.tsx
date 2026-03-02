"use client";

import { useMemo } from "react";
import { MarkerDot } from "./MarkerDot";
import type { AnswerToken, Marker } from "@/domain/models/types";

interface MarkerOverlayLayerProps {
  markers: Marker[];
  pageNumber: number;
  renderWidth: number;
  renderHeight: number;
  onMarkerClick: (marker: Marker) => void;
  onMarkerDragEnd: (
    markerId: string,
    pageNumber: number,
    xPct: number,
    yPct: number
  ) => void;
  getPageRect: () => DOMRect | undefined;
  highlightedMarkerId: string | null;
  reviewMode?: boolean;
  gabaritoByQuestion?: Map<number, AnswerToken>;
}

export function MarkerOverlayLayer({
  markers,
  pageNumber,
  renderWidth,
  renderHeight,
  onMarkerClick,
  onMarkerDragEnd,
  getPageRect,
  highlightedMarkerId,
  reviewMode = false,
  gabaritoByQuestion,
}: MarkerOverlayLayerProps) {
  const pageMarkers = useMemo(
    () => markers.filter((m) => m.pageNumber === pageNumber),
    [markers, pageNumber]
  );

  if (pageMarkers.length === 0) return null;

  return (
    <>
      {pageMarkers.map((marker) => (
        <MarkerDot
          key={marker.id}
          marker={marker}
          renderWidth={renderWidth}
          renderHeight={renderHeight}
          onClick={() => onMarkerClick(marker)}
          onDragEnd={(xPct, yPct) =>
            onMarkerDragEnd(marker.id, pageNumber, xPct, yPct)
          }
          getPageRect={getPageRect}
          isHighlighted={marker.id === highlightedMarkerId}
          gabaritoToken={reviewMode ? gabaritoByQuestion?.get(marker.questionNumber) ?? null : null}
        />
      ))}
    </>
  );
}
