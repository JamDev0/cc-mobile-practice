"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { tapToPct } from "@/domain/models/coordinates";
import type { PendingMarker } from "../types";

// Worker must match react-pdf's bundled pdfjs-dist; postinstall copies from react-pdf's node_modules
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PdfViewportProps {
  pdfBlob: Blob | null;
  pageCount: number | null;
  onPageCountKnown: (numPages: number) => void;
  onPageTap: (
    pageNumber: number,
    xPct: number,
    yPct: number,
    clientX: number,
    clientY: number,
    pointerId: number,
    pointerType: string
  ) => void;
  renderMarkerOverlay: (
    pageNumber: number,
    width: number,
    height: number,
    getPageRect: () => DOMRect | undefined
  ) => React.ReactNode;
  pendingMarker: PendingMarker | null;
  activePage: number;
  onActivePageChange: (page: number) => void;
  highlightedMarkerId: string | null;
  /** When set, scrolls this page into view (for jump-to-marker). */
  scrollToPageNumber: number | null;
  /** Optional marker id to scroll into view when available. */
  scrollToMarkerId?: string | null;
  /** Called when scroll attempt completes (success or retries exhausted). Per spec 09 §4.3. */
  onScrollAttempted?: (success: boolean) => void;
  /** When true, disables scrolling (e.g. while radial picker gesture is active). */
  disableScroll?: boolean;
}

/** Per spec 06 §4.3.3: fallback to fully rendered page list for V1 scroll continuity.
 * Windowing blocked natural scrolling past early pages. */
const RENDER_WINDOW_FALLBACK = 2;

/** Per spec 09 §4.3: bounded retries when page node not yet mounted. */
const SCROLL_RETRY_MAX = 60;
const LONG_PRESS_MS = 150;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

export function PdfViewport({
  pdfBlob,
  pageCount,
  onPageCountKnown,
  onPageTap,
  renderMarkerOverlay,
  pendingMarker,
  activePage,
  onActivePageChange,
  highlightedMarkerId,
  scrollToPageNumber,
  scrollToMarkerId,
  onScrollAttempted,
  disableScroll = false,
}: PdfViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRectRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const longPressRef = useRef<{
    pointerId: number;
    pageNumber: number;
    startClientX: number;
    startClientY: number;
    latestClientX: number;
    latestClientY: number;
    timeoutId: ReturnType<typeof setTimeout> | null;
    cancelled: boolean;
    triggered: boolean;
  } | null>(null);
  const [pageDimensions, setPageDimensions] = useState<
    Map<number, { width: number; height: number }>
  >(new Map());

  useEffect(() => {
    if (scrollToPageNumber == null) return;
    if (!pdfBlob) {
      onScrollAttempted?.(false);
      return;
    }
    if (!containerRef.current) return;
    const targetPage = scrollToPageNumber;
    let attempts = 0;
    let cancelled = false;
    let scrolledPageOnce = false;

    const tryScroll = () => {
      if (cancelled) return;
      attempts += 1;
      const markerSelector =
        scrollToMarkerId != null
          ? `[data-marker-id="${scrollToMarkerId.replace(/"/g, '\\"')}"]`
          : null;
      const markerEl = markerSelector
        ? containerRef.current?.querySelector(markerSelector)
        : null;
      if (markerEl) {
        markerEl.scrollIntoView({ block: "center", behavior: "smooth" });
        onScrollAttempted?.(true);
        return;
      }
      const pageEl = containerRef.current?.querySelector(
        `[data-page-number="${targetPage}"]`
      );
      if (pageEl) {
        if (!scrolledPageOnce) {
          pageEl.scrollIntoView({ block: "center", behavior: "smooth" });
          scrolledPageOnce = true;
        }
        if (scrollToMarkerId == null) {
          onScrollAttempted?.(true);
          return;
        }
        // Marker target requested: keep retrying until marker element mounts.
      }
      if (attempts >= SCROLL_RETRY_MAX) {
        onScrollAttempted?.(false);
        return;
      }
      requestAnimationFrame(tryScroll);
    };

    requestAnimationFrame(tryScroll);
    return () => {
      cancelled = true;
    };
  }, [scrollToPageNumber, scrollToMarkerId, onScrollAttempted, pdfBlob]);

  const handlePageLoadSuccess = useCallback(
    ({ pageNumber, width, height }: { pageNumber: number; width: number; height: number }) => {
      setPageDimensions((prev) => {
        const next = new Map(prev);
        next.set(pageNumber, { width, height });
        return next;
      });
    },
    []
  );

  const cancelLongPress = useCallback(() => {
    const current = longPressRef.current;
    if (!current) return;
    if (current.timeoutId) clearTimeout(current.timeoutId);
    longPressRef.current = null;
  }, []);

  const handlePagePointerDown = useCallback(
    (pageNumber: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (longPressRef.current) return;

      const targetEl = e.currentTarget;
      const dims =
        pageDimensions.get(pageNumber) ?? {
          width: targetEl.getBoundingClientRect().width,
          height: targetEl.getBoundingClientRect().height,
        };
      const pointerType = e.pointerType;

      const timeoutId = setTimeout(() => {
        const state = longPressRef.current;
        if (!state || state.cancelled) return;
        state.triggered = true;
        const rect = targetEl.getBoundingClientRect();
        const clickX = state.latestClientX - rect.left;
        const clickY = state.latestClientY - rect.top;
        const { xPct, yPct } = tapToPct(clickX, clickY, dims.width, dims.height);
        onPageTap(
          pageNumber,
          xPct,
          yPct,
          state.latestClientX,
          state.latestClientY,
          state.pointerId,
          pointerType
        );
        // Do not clear the ref here; we still want to ignore post-trigger move-cancel logic.
      }, LONG_PRESS_MS);

      longPressRef.current = {
        pointerId: e.pointerId,
        pageNumber,
        startClientX: e.clientX,
        startClientY: e.clientY,
        latestClientX: e.clientX,
        latestClientY: e.clientY,
        timeoutId,
        cancelled: false,
        triggered: false,
      };
    },
    [pageDimensions, onPageTap]
  );

  const handlePageTouchStart = useCallback(
    (pageNumber: number) => (e: React.TouchEvent<HTMLDivElement>) => {
      // Prefer pointer events on browsers that support them.
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      if (longPressRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();

      const targetEl = e.currentTarget;
      const dims =
        pageDimensions.get(pageNumber) ?? {
          width: targetEl.getBoundingClientRect().width,
          height: targetEl.getBoundingClientRect().height,
        };

      const timeoutId = setTimeout(() => {
        const state = longPressRef.current;
        if (!state || state.cancelled) return;
        state.triggered = true;
        const rect = targetEl.getBoundingClientRect();
        const clickX = state.latestClientX - rect.left;
        const clickY = state.latestClientY - rect.top;
        const { xPct, yPct } = tapToPct(clickX, clickY, dims.width, dims.height);
        onPageTap(
          pageNumber,
          xPct,
          yPct,
          state.latestClientX,
          state.latestClientY,
          state.pointerId,
          "touch"
        );
      }, LONG_PRESS_MS);

      longPressRef.current = {
        pointerId: t.identifier,
        pageNumber,
        startClientX: t.clientX,
        startClientY: t.clientY,
        latestClientX: t.clientX,
        latestClientY: t.clientY,
        timeoutId,
        cancelled: false,
        triggered: false,
      };
    },
    [pageDimensions, onPageTap]
  );

  const handlePageTouchMove = useCallback(
    (pageNumber: number) => (e: React.TouchEvent<HTMLDivElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      const state = longPressRef.current;
      if (!state) return;
      if (state.pageNumber !== pageNumber) return;
      const t = Array.from(e.touches).find((x) => x.identifier === state.pointerId);
      if (!t) return;
      e.preventDefault();
      state.latestClientX = t.clientX;
      state.latestClientY = t.clientY;
      if (state.triggered) return;
      const dx = t.clientX - state.startClientX;
      const dy = t.clientY - state.startClientY;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
        state.cancelled = true;
        cancelLongPress();
      }
    },
    [cancelLongPress]
  );

  const handlePageTouchEndOrCancel = useCallback(
    (_pageNumber: number) => (_e: React.TouchEvent<HTMLDivElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      cancelLongPress();
    },
    [cancelLongPress]
  );

  const handlePagePointerMove = useCallback(
    (pageNumber: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      const state = longPressRef.current;
      if (!state) return;
      if (state.pageNumber !== pageNumber) return;
      if (state.pointerId !== e.pointerId) return;
      state.latestClientX = e.clientX;
      state.latestClientY = e.clientY;
      if (state.triggered) return;
      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
        state.cancelled = true;
        cancelLongPress();
      }
    },
    [cancelLongPress]
  );

  const handlePagePointerUpOrCancel = useCallback(
    (_pageNumber: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      const state = longPressRef.current;
      if (!state || state.pointerId !== e.pointerId) return;
      cancelLongPress();
    },
    [cancelLongPress]
  );

  if (!pdfBlob) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <p>No PDF loaded.</p>
      </div>
    );
  }

  const startPage = 1;
  const endPage =
    pageCount != null
      ? pageCount
      : Math.max(activePage + RENDER_WINDOW_FALLBACK, 3);

  const pages = [];
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div
      ref={containerRef}
      data-testid="pdf-viewport-scroll"
      style={{
        flex: 1,
        overflow: disableScroll ? "hidden" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        touchAction: disableScroll ? "none" : "pan-y",
        overscrollBehavior: "none",
      }}
      onScroll={() => {
        // If user scrolls normally, cancel any pending long-press detection.
        if (longPressRef.current && !longPressRef.current.triggered) {
          cancelLongPress();
        }
        if (disableScroll) return;
        if (!containerRef.current || pageCount == null) return;
        const el = containerRef.current;
        const containerRect = el.getBoundingClientRect();
        const viewportCenterY = containerRect.top + containerRect.height / 2;
        const pageEls = el.querySelectorAll("[data-page-number]");
        let closestPage = activePage;
        let minDist = Infinity;
        for (const pageEl of pageEls) {
          const num = pageEl.getAttribute("data-page-number");
          if (!num) continue;
          const rect = pageEl.getBoundingClientRect();
          const pageCenterY = rect.top + rect.height / 2;
          const dist = Math.abs(pageCenterY - viewportCenterY);
          if (dist < minDist) {
            minDist = dist;
            closestPage = parseInt(num, 10);
          }
        }
        if (closestPage !== activePage) onActivePageChange(closestPage);
      }}
    >
      <Document
        file={pdfBlob}
        onLoadSuccess={({ numPages }) => {
          onPageCountKnown(numPages);
        }}
        loading={
          <div style={{ padding: "2rem" }}>
            <p>Loading PDF...</p>
          </div>
        }
        error={
          <div style={{ padding: "2rem", color: "red" }}>
            <p>Failed to load PDF.</p>
          </div>
        }
      >
        {pages.map((pageNum) => (
          <div
            key={pageNum}
            style={{
              position: "relative",
              marginBottom: "1rem",
            }}
            data-page-number={pageNum}
            ref={(el) => {
              if (el) pageRectRefs.current.set(pageNum, el);
            }}
          >
            <div
              data-testid={`pdf-page-hitbox-${pageNum}`}
              onContextMenu={(e) => {
                // Avoid long-press context menu interfering with the gesture.
                e.preventDefault();
              }}
              onPointerDown={handlePagePointerDown(pageNum)}
              onPointerMove={handlePagePointerMove(pageNum)}
              onPointerUp={handlePagePointerUpOrCancel(pageNum)}
              onPointerCancel={handlePagePointerUpOrCancel(pageNum)}
              onTouchStart={handlePageTouchStart(pageNum)}
              onTouchMove={handlePageTouchMove(pageNum)}
              onTouchEnd={handlePageTouchEndOrCancel(pageNum)}
              onTouchCancel={handlePageTouchEndOrCancel(pageNum)}
              style={{
                cursor: "pointer",
                position: "relative",
                touchAction: pendingMarker ? "none" : "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <Page
                pageNumber={pageNum}
                width={Math.min(
                  containerRef.current?.clientWidth ?? 400,
                  400
                )}
                onLoadSuccess={(page) => {
                  handlePageLoadSuccess({
                    pageNumber: pageNum,
                    width: page.width,
                    height: page.height,
                  });
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              {(() => {
                const dims = pageDimensions.get(pageNum);
                if (!dims) return null;
                const getPageRect = () =>
                  pageRectRefs.current.get(pageNum)?.getBoundingClientRect();
                return renderMarkerOverlay(
                  pageNum,
                  dims.width,
                  dims.height,
                  getPageRect
                );
              })()}
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
