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
  highlightedMarkerId: string | null;
}

export function MarkerOverlayLayer({
  markers,
  pageNumber,
  renderWidth,
  renderHeight,
  onMarkerClick,
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
          isHighlighted={marker.id === highlightedMarkerId}
        />
      ))}
    </>
  );
}
