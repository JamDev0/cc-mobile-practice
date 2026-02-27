import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PdfViewport } from "./PdfViewport";

vi.mock("react-pdf", () => {
  const Document = ({
    children,
    onLoadSuccess,
  }: {
    children: React.ReactNode;
    onLoadSuccess?: (payload: { numPages: number }) => void;
  }) => {
    const didCallRef = React.useRef(false);
    React.useEffect(() => {
      if (didCallRef.current) return;
      didCallRef.current = true;
      onLoadSuccess?.({ numPages: 1 });
    }, [onLoadSuccess]);
    return <div>{children}</div>;
  };
  const Page = ({
    pageNumber,
    onLoadSuccess,
  }: {
    pageNumber: number;
    onLoadSuccess?: (payload: { width: number; height: number }) => void;
  }) => {
    const didCallRef = React.useRef(false);
    React.useEffect(() => {
      if (didCallRef.current) return;
      didCallRef.current = true;
      onLoadSuccess?.({ width: 400, height: 600 });
    }, [onLoadSuccess]);
    return <div>Page {pageNumber}</div>;
  };
  return { Document, Page, pdfjs: { GlobalWorkerOptions: { workerSrc: "" } } };
});

describe("PdfViewport interactions", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("activates marker creation only after long press", async () => {
    vi.useFakeTimers();
    const onPageTap = vi.fn();
    render(
      <PdfViewport
        pdfBlob={new Blob(["%PDF-1.4"], { type: "application/pdf" })}
        pageCount={1}
        onPageCountKnown={() => {}}
        onPageTap={onPageTap}
        renderMarkerOverlay={() => null}
        pendingMarker={null}
        activePage={1}
        onActivePageChange={() => {}}
        highlightedMarkerId={null}
        scrollToPageNumber={null}
      />
    );

    const page = screen.getByText("Page 1");
    const pageContainer = page.parentElement as HTMLElement;
    fireEvent.pointerDown(pageContainer, {
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 300,
      pointerId: 7,
    });

    await vi.advanceTimersByTimeAsync(140);
    expect(onPageTap).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(20);
    expect(onPageTap).toHaveBeenCalledTimes(1);
  });

  it("does not create marker when moved during long press window", async () => {
    vi.useFakeTimers();
    const onPageTap = vi.fn();
    render(
      <PdfViewport
        pdfBlob={new Blob(["%PDF-1.4"], { type: "application/pdf" })}
        pageCount={1}
        onPageCountKnown={() => {}}
        onPageTap={onPageTap}
        renderMarkerOverlay={() => null}
        pendingMarker={null}
        activePage={1}
        onActivePageChange={() => {}}
        highlightedMarkerId={null}
        scrollToPageNumber={null}
      />
    );

    const page = screen.getByText("Page 1");
    const pageContainer = page.parentElement as HTMLElement;
    fireEvent.pointerDown(pageContainer, {
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 300,
      pointerId: 7,
    });
    fireEvent.pointerMove(pageContainer, {
      pointerType: "mouse",
      clientX: 240,
      clientY: 340,
      pointerId: 7,
    });

    await vi.advanceTimersByTimeAsync(200);
    expect(onPageTap).toHaveBeenCalledTimes(0);
  });

  it("disables scroll when disableScroll prop is true", () => {
    render(
      <PdfViewport
        pdfBlob={new Blob(["%PDF-1.4"], { type: "application/pdf" })}
        pageCount={1}
        onPageCountKnown={() => {}}
        onPageTap={() => {}}
        renderMarkerOverlay={() => null}
        pendingMarker={{ pageNumber: 1, xPct: 0.5, yPct: 0.5, suggestedQuestionNumber: 1, selectedToken: null }}
        activePage={1}
        onActivePageChange={() => {}}
        highlightedMarkerId={null}
        scrollToPageNumber={null}
        disableScroll
      />
    );
    const viewport = screen.getByTestId("pdf-viewport-scroll");
    const style = viewport.getAttribute("style") ?? "";
    expect(style).toContain("overflow: hidden");
  });

  it("allows scroll when disableScroll is false", () => {
    render(
      <PdfViewport
        pdfBlob={new Blob(["%PDF-1.4"], { type: "application/pdf" })}
        pageCount={1}
        onPageCountKnown={() => {}}
        onPageTap={() => {}}
        renderMarkerOverlay={() => null}
        pendingMarker={null}
        activePage={1}
        onActivePageChange={() => {}}
        highlightedMarkerId={null}
        scrollToPageNumber={null}
        disableScroll={false}
      />
    );
    const viewport = screen.getByTestId("pdf-viewport-scroll");
    const style = viewport.getAttribute("style") ?? "";
    expect(style).toContain("overflow: auto");
  });

  it("jump prefers marker target when marker is mounted", async () => {
    vi.useRealTimers();
    const onScrollAttempted = vi.fn();
    const markerScroll = vi.fn();
    render(
      <PdfViewport
        pdfBlob={new Blob(["%PDF-1.4"], { type: "application/pdf" })}
        pageCount={1}
        onPageCountKnown={() => {}}
        onPageTap={() => {}}
        renderMarkerOverlay={() => (
          <div
            data-marker-id="target-marker"
            ref={(el) => {
              if (el) {
                el.scrollIntoView = markerScroll;
              }
            }}
          />
        )}
        pendingMarker={null}
        activePage={1}
        onActivePageChange={() => {}}
        highlightedMarkerId="target-marker"
        scrollToPageNumber={1}
        scrollToMarkerId="target-marker"
        onScrollAttempted={onScrollAttempted}
      />
    );

    await waitFor(() => {
      expect(markerScroll).toHaveBeenCalled();
      expect(onScrollAttempted).toHaveBeenCalledWith(true);
    });
  });
});
