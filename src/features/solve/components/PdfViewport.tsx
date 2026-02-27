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
    clientY: number
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
}

/** Per spec 06 §4.3.3: fallback to fully rendered page list for V1 scroll continuity.
 * Windowing blocked natural scrolling past early pages. */
const RENDER_WINDOW_FALLBACK = 2;

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
}: PdfViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRectRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [pageDimensions, setPageDimensions] = useState<
    Map<number, { width: number; height: number }>
  >(new Map());

  useEffect(() => {
    if (scrollToPageNumber == null || !containerRef.current) return;
    const pageEl = containerRef.current.querySelector(
      `[data-page-number="${scrollToPageNumber}"]`
    );
    if (pageEl) {
      pageEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [scrollToPageNumber]);

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

  const handlePageClick = useCallback(
    (pageNumber: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const dims = pageDimensions.get(pageNumber);
      if (!dims) return;
      const { xPct, yPct } = tapToPct(
        clickX,
        clickY,
        dims.width,
        dims.height
      );
      onPageTap(pageNumber, xPct, yPct, e.clientX, e.clientY);
    },
    [pageDimensions, onPageTap]
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
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
      }}
      onScroll={() => {
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
          >
            <div
              onClick={handlePageClick(pageNum)}
              style={{
                cursor: "pointer",
                position: "relative",
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
              ref={(el) => {
                if (el) pageRectRefs.current.set(pageNum, el);
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
