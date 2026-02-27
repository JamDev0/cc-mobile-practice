import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

/** jsdom lacks PointerEvent; testing-library falls back to Event which has no clientX/clientY. */
if (typeof globalThis.PointerEvent === "undefined") {
  const PolyfilledPointerEvent = class extends MouseEvent {
    pointerId: number;
    constructor(type: string, init?: MouseEventInit & { pointerId?: number }) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 0;
    }
  };
  (globalThis as Record<string, unknown>).PointerEvent = PolyfilledPointerEvent;
}
