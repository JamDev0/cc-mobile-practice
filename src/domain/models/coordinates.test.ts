import { describe, it, expect } from "vitest";
import { tapToPct, pctToPixel } from "./coordinates";

describe("coordinates", () => {
  describe("tapToPct", () => {
    it("normalizes tap to [0,1] with 4 decimal precision", () => {
      const { xPct, yPct } = tapToPct(50, 25, 100, 100);
      expect(xPct).toBe(0.5);
      expect(yPct).toBe(0.25);
    });

    it("clamps out-of-bounds values", () => {
      const { xPct, yPct } = tapToPct(150, -10, 100, 100);
      expect(xPct).toBe(1);
      expect(yPct).toBe(0);
    });
  });

  describe("pctToPixel", () => {
    it("reverses tapToPct mapping", () => {
      const { pixelX, pixelY } = pctToPixel(0.5, 0.25, 100, 100);
      expect(pixelX).toBe(50);
      expect(pixelY).toBe(25);
    });

    it("S-UI-07: orientation change - same xPct/yPct with different dimensions yields correct relative position", () => {
      // When device rotates, render dimensions change. Marker stores normalized coords only.
      // Pixel projection must recompute from xPct/yPct so marker stays at same relative position.
      const xPct = 0.5;
      const yPct = 0.5;
      const portrait = pctToPixel(xPct, yPct, 100, 200);
      const landscape = pctToPixel(xPct, yPct, 200, 100);
      expect(portrait.pixelX).toBe(50);
      expect(portrait.pixelY).toBe(100);
      expect(landscape.pixelX).toBe(100);
      expect(landscape.pixelY).toBe(50);
      // Same relative position (center): 50% of width, 50% of height
      expect(portrait.pixelX / 100).toBe(xPct);
      expect(portrait.pixelY / 200).toBe(yPct);
      expect(landscape.pixelX / 200).toBe(xPct);
      expect(landscape.pixelY / 100).toBe(yPct);
    });
  });
});
