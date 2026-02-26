"use client";

import { useMemo } from "react";
import { MarkerDot } from "./MarkerDot";
import type { Marker } from "@/domain/models/types";

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
        />
      ))}
    </>
  );
}
