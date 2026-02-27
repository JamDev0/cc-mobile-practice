"use client";

import { useCallback, useRef, useState } from "react";
import { pctToPixel } from "@/domain/models/coordinates";
import { tapToPct } from "@/domain/models/coordinates";
import type { Marker } from "@/domain/models/types";

interface MarkerDotProps {
  marker: Marker;
  renderWidth: number;
  renderHeight: number;
  onClick: () => void;
  onDragEnd: (xPct: number, yPct: number) => void;
  getPageRect: () => DOMRect | undefined;
  isHighlighted: boolean;
}

const DRAG_THRESHOLD_PX = 4;

export function MarkerDot({
  marker,
  renderWidth,
  renderHeight,
  onClick,
  onDragEnd,
  getPageRect,
  isHighlighted,
}: MarkerDotProps) {
  const [dragPos, setDragPos] = useState<{ xPct: number; yPct: number } | null>(
    null
  );
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const lastDragPosRef = useRef<{ xPct: number; yPct: number } | null>(null);
  const ignoreNextClickRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ xPct: number; yPct: number } | null>(null);

  const displayX = dragPos?.xPct ?? marker.xPct;
  const displayY = dragPos?.yPct ?? marker.yPct;
  const { pixelX, pixelY } = pctToPixel(
    displayX,
    displayY,
    renderWidth,
    renderHeight
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (typeof e.currentTarget.setPointerCapture === "function") {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      didDragRef.current = false;
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!didDragRef.current && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) {
        didDragRef.current = true;
      }

      if (didDragRef.current) {
        const rect = getPageRect();
        if (!rect) return;
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const { xPct, yPct } = tapToPct(relX, relY, rect.width, rect.height);
        const pos = { xPct, yPct };
        lastDragPosRef.current = pos;
        pendingPosRef.current = pos;
        if (rafIdRef.current == null) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            const pending = pendingPosRef.current;
            if (pending) setDragPos(pending);
          });
        }
      }
    },
    [getPageRect]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (typeof e.currentTarget.releasePointerCapture === "function") {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      dragStartRef.current = null;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingPosRef.current = null;

      const committed = lastDragPosRef.current;
      lastDragPosRef.current = null;
      setDragPos(null);

      if (didDragRef.current && committed) {
        ignoreNextClickRef.current = true;
        onDragEnd(committed.xPct, committed.yPct);
      }
    },
    [onDragEnd]
  );

  const handlePointerCancel = useCallback(() => {
    dragStartRef.current = null;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingPosRef.current = null;
    setDragPos(null);
  }, []);

  const token = marker.answerToken ?? "?";
  const isConflict = marker.status === "conflict";

  return (
    <div
      className="marker-dot"
      data-marker-id={marker.id}
      role="button"
      tabIndex={0}
      aria-label={`Marker question ${marker.questionNumber}, answer ${token}${
        isConflict ? ", conflict" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(e) => {
        e.stopPropagation();
        if (ignoreNextClickRef.current) {
          ignoreNextClickRef.current = false;
          return;
        }
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
        left: 0,
        top: 0,
        transform: `translate(${pixelX - 12}px, ${pixelY - 12}px)`,
        willChange: dragPos ? "transform" : "auto",
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
        cursor: "grab",
        pointerEvents: "auto",
        boxShadow: isHighlighted ? "0 0 0 3px rgba(59, 130, 246, 0.5)" : undefined,
        transition: dragPos ? "none" : "box-shadow 0.2s",
        touchAction: "none",
      }}
    >
      {token}
    </div>
  );
}
