"use client";

import { pctToPixel } from "@/domain/models/coordinates";
import type { Marker } from "@/domain/models/types";

interface MarkerDotProps {
  marker: Marker;
  renderWidth: number;
  renderHeight: number;
  onClick: () => void;
  isHighlighted: boolean;
}

export function MarkerDot({
  marker,
  renderWidth,
  renderHeight,
  onClick,
  isHighlighted,
}: MarkerDotProps) {
  const { pixelX, pixelY } = pctToPixel(
    marker.xPct,
    marker.yPct,
    renderWidth,
    renderHeight
  );

  const token = marker.answerToken ?? "?";
  const isConflict = marker.status === "conflict";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Marker question ${marker.questionNumber}, answer ${token}${
        isConflict ? ", conflict" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        position: "absolute",
        left: pixelX - 12,
        top: pixelY - 12,
        width: 24,
        height: 24,
        minWidth: 24,
        minHeight: 24,
        borderRadius: "50%",
        background: isConflict
          ? "#f59e0b"
          : isHighlighted
            ? "#3b82f6"
            : "#22c55e",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 600,
        cursor: "pointer",
        pointerEvents: "auto",
        boxShadow: isHighlighted ? "0 0 0 3px rgba(59, 130, 246, 0.5)" : undefined,
        transition: "box-shadow 0.2s",
      }}
    >
      {token}
    </div>
  );
}
