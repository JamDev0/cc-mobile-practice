import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MarkerDot } from "./MarkerDot";
import type { Marker } from "@/domain/models/types";

const marker: Marker = {
  id: "marker-1",
  sessionId: "s1",
  pageNumber: 1,
  xPct: 0.5,
  yPct: 0.5,
  questionNumber: 1,
  answerToken: "A",
  status: "valid",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("MarkerDot", () => {
  beforeEach(() => {
    cleanup();
  });

  it("opens edit when clicked", () => {
    const onClick = vi.fn();
    const onDragEnd = vi.fn();
    render(
      <div style={{ position: "relative", width: 400, height: 600 }}>
        <MarkerDot
          marker={marker}
          renderWidth={400}
          renderHeight={600}
          onClick={onClick}
          onDragEnd={onDragEnd}
          getPageRect={() =>
            ({
              left: 0,
              top: 0,
              width: 400,
              height: 600,
            } as DOMRect)
          }
          isHighlighted={false}
        />
      </div>
    );

    const dot = screen.getByRole("button", { name: /Marker question 1/i });
    fireEvent.click(dot);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it("drags without triggering edit click", () => {
    const onClick = vi.fn();
    const onDragEnd = vi.fn();
    render(
      <div style={{ position: "relative", width: 400, height: 600 }}>
        <MarkerDot
          marker={marker}
          renderWidth={400}
          renderHeight={600}
          onClick={onClick}
          onDragEnd={onDragEnd}
          getPageRect={() =>
            ({
              left: 0,
              top: 0,
              width: 400,
              height: 600,
            } as DOMRect)
          }
          isHighlighted={false}
        />
      </div>
    );

    const dot = screen.getByRole("button", { name: /Marker question 1/i });
    fireEvent.pointerDown(dot, { pointerId: 1, clientX: 200, clientY: 300 });
    fireEvent.pointerMove(dot, { pointerId: 1, clientX: 240, clientY: 340 });
    fireEvent.pointerUp(dot, { pointerId: 1, clientX: 240, clientY: 340 });
    fireEvent.click(dot);

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
