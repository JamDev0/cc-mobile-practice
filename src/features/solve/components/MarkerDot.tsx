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
  gabaritoToken?: string | null;
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
  gabaritoToken = null,
}: MarkerDotProps) {
  const [dragPos, setDragPos] = useState<{ xPct: number; yPct: number } | null>(
    null
  );
  const [committedPos, setCommittedPos] = useState<{ xPct: number; yPct: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const lastDragPosRef = useRef<{ xPct: number; yPct: number } | null>(null);
  const ignoreNextClickRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingPosRef = useRef<{ xPct: number; yPct: number } | null>(null);
  const prevMarkerPos = useRef({ xPct: marker.xPct, yPct: marker.yPct });

  if (prevMarkerPos.current.xPct !== marker.xPct || prevMarkerPos.current.yPct !== marker.yPct) {
    prevMarkerPos.current = { xPct: marker.xPct, yPct: marker.yPct };
    if (committedPos) setCommittedPos(null);
  }

  const displayX = dragPos?.xPct ?? committedPos?.xPct ?? marker.xPct;
  const displayY = dragPos?.yPct ?? committedPos?.yPct ?? marker.yPct;
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
        setCommittedPos(committed);
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
  const showGabarito = gabaritoToken != null;
  const isCorrect = showGabarito && gabaritoToken === marker.answerToken;
  const isWrong = showGabarito && gabaritoToken !== marker.answerToken;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${pixelX - 14}px, ${pixelY - 14}px)`,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        pointerEvents: "none",
      }}
    >
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
        position: "relative",
        willChange: dragPos ? "transform" : "auto",
        width: 28,
        height: 28,
        minWidth: 28,
        minHeight: 28,
        borderRadius: "50%",
        background: isConflict
          ? "var(--color-marker-conflict)"
          : isHighlighted
            ? "var(--color-marker-highlight)"
            : "var(--color-marker-valid)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
        pointerEvents: "auto",
        boxShadow: isHighlighted
          ? "0 0 0 3px rgba(59, 130, 246, 0.5)"
          : "var(--shadow-sm)",
        transition: dragPos ? "none" : "box-shadow 0.2s",
        touchAction: "none",
        lineHeight: 1,
        gap: 0,
      }}
    >
      <span style={{ fontSize: 7, fontWeight: 700, opacity: 0.85, letterSpacing: "-0.02em" }}>
        {marker.questionNumber}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, marginTop: -1 }}>
        {token}
      </span>
    </div>
    {showGabarito && (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: isCorrect ? "var(--color-status-correct-bg)" : "var(--color-status-wrong-bg)",
          color: isCorrect ? "var(--color-status-correct-fg)" : "var(--color-status-wrong-fg)",
          border: `1.5px solid ${isCorrect ? "var(--color-status-correct-fg)" : "var(--color-status-wrong-fg)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          marginTop: 4,
          pointerEvents: "none",
        }}
      >
        {gabaritoToken}
      </div>
    )}
    </div>
  );
}
