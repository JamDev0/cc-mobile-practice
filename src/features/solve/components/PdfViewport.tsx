"use client";

import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { tapToPct } from "@/domain/models/coordinates";
import type { PendingMarker } from "../types";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
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
    height: number
  ) => React.ReactNode;
  pendingMarker: PendingMarker | null;
  activePage: number;
  onActivePageChange: (page: number) => void;
  highlightedMarkerId: string | null;
}

const RENDER_WINDOW = 1;

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
}: PdfViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDimensions, setPageDimensions] = useState<
    Map<number, { width: number; height: number }>
  >(new Map());

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

  const startPage = Math.max(1, activePage - RENDER_WINDOW);
  const endPage =
    pageCount != null
      ? Math.min(pageCount, activePage + RENDER_WINDOW)
      : activePage + RENDER_WINDOW;

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
        const scrollTop = el.scrollTop;
        const children = Array.from(el.children);
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const rect = child.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          const midY = rect.top + rect.height / 2 - containerRect.top;
          if (midY >= 0 && midY <= el.clientHeight / 2) {
            const pageEl = child.querySelector("[data-page-number]");
            const num = pageEl?.getAttribute("data-page-number");
            if (num) onActivePageChange(parseInt(num, 10));
            break;
          }
        }
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
                return renderMarkerOverlay(pageNum, dims.width, dims.height);
              })()}
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
