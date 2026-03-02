"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { tapToPct } from "@/domain/models/coordinates";
import type { PendingMarker } from "../types";

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
  scrollToPageNumber: number | null;
  scrollToMarkerId?: string | null;
  onScrollAttempted?: (success: boolean) => void;
  disableScroll?: boolean;
}

const RENDER_WINDOW_FALLBACK = 2;
const SCROLL_RETRY_MAX = 60;
const LONG_PRESS_MS = 150;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.15;

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
  const activePageRef = useRef(activePage);
  const scrollRafRef = useRef<number | null>(null);
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
  const [scale, setScale] = useState(1);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

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
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      if (longPressRef.current) return;
      if (e.touches.length >= 2) return;
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
      if (e.touches.length >= 2) return;
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale((s) =>
        Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s + delta))
      );
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const baseWidth = Math.min(
    containerRef.current?.clientWidth ?? 400,
    400
  );
  const scaledWidth = baseWidth * scale;
  const devicePixelRatio =
    typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  if (!pdfBlob) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          color: "var(--color-text-muted)",
        }}
      >
        <p>No PDF loaded.</p>
      </div>
    );
  }

  const startPage = 1;
  const renderWindowEnd = Math.max(
    activePage + RENDER_WINDOW_FALLBACK,
    scrollToPageNumber != null ? scrollToPageNumber + RENDER_WINDOW_FALLBACK : 0,
    3
  );
  const endPage =
    pageCount != null
      ? Math.min(pageCount, renderWindowEnd)
      : renderWindowEnd;

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
        minHeight: 0,
        width: "100%",
        overflow: disableScroll ? "hidden" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        touchAction: disableScroll ? "none" : "pan-x pan-y",
        overscrollBehavior: "none",
        background: "var(--color-bg)",
      }}
      onScroll={() => {
        if (longPressRef.current && !longPressRef.current.triggered) {
          cancelLongPress();
        }
        if (disableScroll) return;
        if (!containerRef.current || pageCount == null) return;
        if (scrollRafRef.current != null) return;
        scrollRafRef.current = requestAnimationFrame(() => {
          scrollRafRef.current = null;
          const el = containerRef.current;
          if (!el) return;
          const containerRect = el.getBoundingClientRect();
          const viewportCenterY = containerRect.top + containerRect.height / 2;
          let closestPage = activePageRef.current;
          let minDist = Infinity;
          for (const [pageNumber, pageEl] of pageRectRefs.current.entries()) {
            if (!pageEl) continue;
            const rect = pageEl.getBoundingClientRect();
            const pageCenterY = rect.top + rect.height / 2;
            const dist = Math.abs(pageCenterY - viewportCenterY);
            if (dist < minDist) {
              minDist = dist;
              closestPage = pageNumber;
            }
          }
          if (closestPage !== activePageRef.current) {
            activePageRef.current = closestPage;
            onActivePageChange(closestPage);
          }
        });
      }}
    >
      <Document
        file={pdfBlob}
        onLoadSuccess={({ numPages }) => {
          onPageCountKnown(numPages);
        }}
        loading={
          <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>
            <p>Loading PDF...</p>
          </div>
        }
        error={
          <div style={{ padding: "2rem", color: "var(--color-danger)" }}>
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
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              boxShadow: "var(--shadow-md)",
            }}
            data-page-number={pageNum}
            ref={(el) => {
              if (el) {
                pageRectRefs.current.set(pageNum, el);
              } else {
                pageRectRefs.current.delete(pageNum);
              }
            }}
          >
            <div
              data-testid={`pdf-page-hitbox-${pageNum}`}
              onContextMenu={(e) => {
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
                touchAction: disableScroll ? "none" : "pan-x pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <Page
                pageNumber={pageNum}
                width={scaledWidth}
                devicePixelRatio={devicePixelRatio}
                renderTextLayer={false}
                renderAnnotationLayer={false}
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
