"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ANSWER_TOKENS } from "@/domain/models/constants";
import type { AnswerToken } from "@/domain/models/types";

interface RadialPickerPortalProps {
  anchorX: number;
  anchorY: number;
  questionNumber: number;
  initialPointer?: {
    pointerId: number;
    pointerType: string;
    clientX: number;
    clientY: number;
  };
  onSelect: (token: AnswerToken) => void;
  onCancel: () => void;
}

const OUTER_RADIUS = 72;
const INNER_RADIUS = 24;
const SLICE_COUNT = 6;
const SLICE_ANGLE = (2 * Math.PI) / SLICE_COUNT;
const RADIAL_OVERLAY_Z_INDEX = 90;

const TOKENS: AnswerToken[] = [...ANSWER_TOKENS];

function settleOnce(
  settledRef: { current: boolean },
  fn: () => void
): void {
  if (settledRef.current) return;
  settledRef.current = true;
  fn();
}

export function RadialPickerPortal({
  anchorX,
  anchorY,
  questionNumber,
  initialPointer,
  onSelect,
  onCancel,
}: RadialPickerPortalProps) {
  const [previewToken, setPreviewToken] = useState<AnswerToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const settledRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);

  const getTokenAtAngle = useCallback((angle: number) => {
    const normalized = ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(normalized / SLICE_ANGLE) % SLICE_COUNT;
    return TOKENS[index];
  }, []);

  const getPositionFromClient = useCallback(
    (clientX: number, clientY: number): { dist: number; angle: number } | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = clientX - rect.left - cx;
      const dy = clientY - rect.top - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      return { dist, angle };
    },
    []
  );

  useEffect(() => {
    if (!initialPointer) return;
    if (!overlayRef.current) return;
    if (activePointerRef.current != null) return;
    activePointerRef.current = initialPointer.pointerId;
    settledRef.current = false;
    if (typeof overlayRef.current.setPointerCapture === "function") {
      overlayRef.current.setPointerCapture(initialPointer.pointerId);
    }
    const pos = getPositionFromClient(initialPointer.clientX, initialPointer.clientY);
    if (pos && pos.dist >= INNER_RADIUS) {
      setPreviewToken(getTokenAtAngle(pos.angle));
    } else {
      setPreviewToken(null);
    }
  }, [initialPointer, getPositionFromClient, getTokenAtAngle]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (activePointerRef.current != null) return;
      activePointerRef.current = e.pointerId;
      settledRef.current = false;
      if (typeof overlayRef.current?.setPointerCapture === "function") {
        overlayRef.current.setPointerCapture(e.pointerId);
      }
      const pos = getPositionFromClient(e.clientX, e.clientY);
      if (pos && pos.dist >= INNER_RADIUS) {
        setPreviewToken(getTokenAtAngle(pos.angle));
      } else {
        setPreviewToken(null);
      }
    },
    [getPositionFromClient, getTokenAtAngle]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (activePointerRef.current !== e.pointerId) return;
      if (!containerRef.current) return;
      const pos = getPositionFromClient(e.clientX, e.clientY);
      if (!pos) return;
      if (pos.dist < INNER_RADIUS) {
        setPreviewToken(null);
      } else {
        setPreviewToken(getTokenAtAngle(pos.angle));
      }
    },
    [getPositionFromClient, getTokenAtAngle]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      if (typeof overlayRef.current?.releasePointerCapture === "function") {
        overlayRef.current.releasePointerCapture(e.pointerId);
      }
      const pos = getPositionFromClient(e.clientX, e.clientY);
      if (!pos) return;
      if (pos.dist < INNER_RADIUS) {
        settleOnce(settledRef, onCancel);
      } else {
        const token = getTokenAtAngle(pos.angle);
        settleOnce(settledRef, () => onSelect(token));
      }
    },
    [getPositionFromClient, getTokenAtAngle, onCancel, onSelect]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      if (typeof overlayRef.current?.releasePointerCapture === "function") {
        overlayRef.current.releasePointerCapture(e.pointerId);
      }
      settleOnce(settledRef, onCancel);
    },
    [onCancel]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (activePointerRef.current != null) return;
      const t = e.touches[0];
      if (!t) return;
      activePointerRef.current = t.identifier;
      settledRef.current = false;
      const pos = getPositionFromClient(t.clientX, t.clientY);
      if (pos && pos.dist >= INNER_RADIUS) {
        setPreviewToken(getTokenAtAngle(pos.angle));
      } else {
        setPreviewToken(null);
      }
    },
    [getPositionFromClient, getTokenAtAngle]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const id = activePointerRef.current;
      if (id == null) return;
      const t = Array.from(e.touches).find((x) => x.identifier === id);
      if (!t) return;
      const pos = getPositionFromClient(t.clientX, t.clientY);
      if (!pos) return;
      if (pos.dist < INNER_RADIUS) {
        setPreviewToken(null);
      } else {
        setPreviewToken(getTokenAtAngle(pos.angle));
      }
    },
    [getPositionFromClient, getTokenAtAngle]
  );

  const handleTouchEndOrCancel = useCallback(
    (e: React.TouchEvent) => {
      const id = activePointerRef.current;
      if (id == null) return;
      activePointerRef.current = null;
      const releasedTouch = Array.from(e.changedTouches).find(
        (t) => t.identifier === id
      );
      if (releasedTouch) {
        const pos = getPositionFromClient(releasedTouch.clientX, releasedTouch.clientY);
        if (pos && pos.dist < INNER_RADIUS) {
          settleOnce(settledRef, onCancel);
          return;
        }
      }
      const token = previewToken;
      if (token == null) {
        settleOnce(settledRef, onCancel);
      } else {
        settleOnce(settledRef, () => onSelect(token));
      }
    },
    [getPositionFromClient, onCancel, onSelect, previewToken]
  );

  const cx = OUTER_RADIUS;
  const cy = OUTER_RADIUS;
  const slicePaths = TOKENS.map((token, i) => {
    const startAngle = -Math.PI + i * SLICE_ANGLE;
    const endAngle = startAngle + SLICE_ANGLE;
    const x1 = cx + OUTER_RADIUS * Math.cos(startAngle);
    const y1 = cy + OUTER_RADIUS * Math.sin(startAngle);
    const x2 = cx + OUTER_RADIUS * Math.cos(endAngle);
    const y2 = cy + OUTER_RADIUS * Math.sin(endAngle);
    const ix1 = cx + INNER_RADIUS * Math.cos(startAngle);
    const iy1 = cy + INNER_RADIUS * Math.sin(startAngle);
    const ix2 = cx + INNER_RADIUS * Math.cos(endAngle);
    const iy2 = cy + INNER_RADIUS * Math.sin(endAngle);
    const large = SLICE_ANGLE > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return { token, path };
  });

  const clientWidth = typeof window !== "undefined" ? window.innerWidth : 400;
  const clientHeight = typeof window !== "undefined" ? window.innerHeight : 600;
  const pickerSize = OUTER_RADIUS * 2;
  let left = anchorX - OUTER_RADIUS;
  let top = anchorY - OUTER_RADIUS;
  if (left < 8) left = 8;
  if (left + pickerSize > clientWidth - 8) left = clientWidth - pickerSize - 8;
  if (top < 8) top = 8;
  if (top + pickerSize > clientHeight - 8) top = clientHeight - pickerSize - 8;

  return (
    <div
      ref={overlayRef}
      data-testid="radial-picker-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: RADIAL_OVERLAY_Z_INDEX,
        pointerEvents: "auto",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => handleTouchEndOrCancel(e)}
      onTouchCancel={(e) => handleTouchEndOrCancel(e)}
      onPointerLeave={() => setPreviewToken(null)}
    >
      <div
        ref={containerRef}
        data-testid="radial-picker-container"
        style={{
          position: "fixed",
          left,
          top,
          width: pickerSize,
          height: pickerSize,
        }}
      >
        <svg
          width={pickerSize}
          height={pickerSize}
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          {slicePaths.map(({ token, path }) => (
            <path
              key={token}
              d={path}
              fill={
                previewToken === token
                  ? "var(--color-radial-active)"
                  : "var(--color-radial-bg)"
              }
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: INNER_RADIUS * 2,
            height: INNER_RADIUS * 2,
            borderRadius: "50%",
            background: "var(--color-radial-center)",
            color: "var(--color-radial-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
            userSelect: "none",
            WebkitUserSelect: "none",
            border: "1px solid var(--color-border)",
          }}
        >
          {questionNumber}
        </div>
        {TOKENS.map((token, i) => {
          const angle = -Math.PI + (i + 0.5) * SLICE_ANGLE;
          const r = (INNER_RADIUS + OUTER_RADIUS) / 2;
          const lx = OUTER_RADIUS + r * Math.cos(angle);
          const ly = OUTER_RADIUS + r * Math.sin(angle);
          return (
            <span
              key={token}
              style={{
                position: "absolute",
                left: lx - 8,
                top: ly - 10,
                width: 16,
                textAlign: "center",
                color: "var(--color-radial-text)",
                fontSize: 12,
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              {token}
            </span>
          );
        })}
      </div>
    </div>
  );
}
