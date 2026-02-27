import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    vi.restoreAllMocks();
  });

  it("activates marker creation on pointer press", async () => {
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

    const page = await screen.findByText("Page 1");
    const pageContainer = page.parentElement as HTMLElement;
    fireEvent.pointerDown(pageContainer, {
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 300,
    });

    await waitFor(() => {
      expect(onPageTap).toHaveBeenCalledTimes(1);
    });
  });

  it("jump prefers marker target when marker is mounted", async () => {
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
