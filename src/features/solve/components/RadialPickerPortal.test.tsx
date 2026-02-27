/**
 * Spec 11 (Radial press-slide-release) acceptance tests RPS-01 through RPS-04.
 * Verifies gesture contract: pointerdown starts, pointermove previews, pointerup commits or cancels.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { RadialPickerPortal } from "./RadialPickerPortal";

/** Slice geometry: OUTER_RADIUS=72, INNER_RADIUS=24, 6 slices. */
const OUTER_RADIUS = 72;
const INNER_RADIUS = 24;
const PICKER_SIZE = OUTER_RADIUS * 2;
const CENTER_OFFSET = OUTER_RADIUS;

/** Point in slice A (index 0): angle -150° = -5π/6, radius 50. */
function sliceAPoint(rectLeft: number, rectTop: number) {
  const r = 50;
  const angle = (-5 * Math.PI) / 6;
  return {
    clientX: rectLeft + CENTER_OFFSET + r * Math.cos(angle),
    clientY: rectTop + CENTER_OFFSET + r * Math.sin(angle),
  };
}

/** Point in slice B (index 1): angle -90°, radius 50. */
function sliceBPoint(rectLeft: number, rectTop: number) {
  const r = 50;
  const angle = -Math.PI / 2;
  return {
    clientX: rectLeft + CENTER_OFFSET + r * Math.cos(angle),
    clientY: rectTop + CENTER_OFFSET + r * Math.sin(angle),
  };
}

/** Point in dead zone (center). */
function deadZonePoint(rectLeft: number, rectTop: number) {
  return {
    clientX: rectLeft + CENTER_OFFSET,
    clientY: rectTop + CENTER_OFFSET,
  };
}

describe("RadialPickerPortal - RPS (Spec 11 press-slide-release)", () => {
  const anchorX = 200;
  const anchorY = 200;
  const rectLeft = anchorX - OUTER_RADIUS;
  const rectTop = anchorY - OUTER_RADIUS;

  let onSelect: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    onSelect = vi.fn();
    onCancel = vi.fn();
    const containerRect: DOMRect = {
      left: rectLeft,
      top: rectTop,
      width: PICKER_SIZE,
      height: PICKER_SIZE,
      right: rectLeft + PICKER_SIZE,
      bottom: rectTop + PICKER_SIZE,
      x: rectLeft,
      y: rectTop,
      toJSON: () => ({}),
    };
    // In jsdom getBoundingClientRect returns zeros. Mock so the picker container
    // (the div with ref that has the SVG) gets correct rect for coordinate math.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () => containerRect
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("RPS-01: Press then release over slice - corresponding token committed", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const container = screen.getByTestId("radial-picker-container");
    const rect = container.getBoundingClientRect();
    expect(rect.width).toBe(PICKER_SIZE);
    expect(rect.left).toBe(rectLeft);

    const overlay = screen.getByTestId("radial-picker-overlay");
    const pointA = sliceAPoint(rect.left, rect.top);
    fireEvent.pointerDown(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });
    fireEvent.pointerUp(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("A");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("RPS-02: Press, slide across slices, release - token under release point committed", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const container = screen.getByTestId("radial-picker-container");
    const rect = container.getBoundingClientRect();
    const overlay = screen.getByTestId("radial-picker-overlay");

    const pointA = sliceAPoint(rect.left, rect.top);
    const pointB = sliceBPoint(rect.left, rect.top);

    fireEvent.pointerDown(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });
    fireEvent.pointerMove(overlay!, { clientX: pointB.clientX, clientY: pointB.clientY, pointerId: 1 });
    fireEvent.pointerUp(overlay!, { clientX: pointB.clientX, clientY: pointB.clientY, pointerId: 1 });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("B");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("RPS-03: Press then release in dead zone - cancel without marker save", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const container = screen.getByTestId("radial-picker-container");
    const rect = container.getBoundingClientRect();
    const overlay = screen.getByTestId("radial-picker-overlay");

    const dead = deadZonePoint(rect.left, rect.top);
    fireEvent.pointerDown(overlay!, { clientX: dead.clientX, clientY: dead.clientY, pointerId: 1 });
    fireEvent.pointerUp(overlay!, { clientX: dead.clientX, clientY: dead.clientY, pointerId: 1 });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("RPS-03-touch: Touch start on slice, release in center - cancels", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const container = screen.getByTestId("radial-picker-container");
    const rect = container.getBoundingClientRect();
    const overlay = screen.getByTestId("radial-picker-overlay");

    const pointA = sliceAPoint(rect.left, rect.top);
    const dead = deadZonePoint(rect.left, rect.top);

    fireEvent.touchStart(overlay!, {
      touches: [{ identifier: 1, clientX: pointA.clientX, clientY: pointA.clientY }],
    });
    fireEvent.touchMove(overlay!, {
      touches: [{ identifier: 1, clientX: dead.clientX, clientY: dead.clientY }],
    });
    fireEvent.touchEnd(overlay!, {
      changedTouches: [{ identifier: 1, clientX: dead.clientX, clientY: dead.clientY }],
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("RPS-04: Pointer cancel during gesture - cancel once, no commit", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const container = screen.getByTestId("radial-picker-container");
    const rect = container.getBoundingClientRect();
    const overlay = screen.getByTestId("radial-picker-overlay");

    const pointA = sliceAPoint(rect.left, rect.top);
    fireEvent.pointerDown(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });
    fireEvent.pointerMove(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });
    fireEvent.pointerCancel(overlay!, { clientX: pointA.clientX, clientY: pointA.clientY, pointerId: 1 });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("NPI: Radial overlay stays below tab bar stacking", () => {
    render(
      <RadialPickerPortal
        anchorX={anchorX}
        anchorY={anchorY}
        questionNumber={1}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const overlay = screen.getByTestId("radial-picker-overlay");
    expect(overlay).toHaveStyle({ zIndex: "90" });
  });
});
