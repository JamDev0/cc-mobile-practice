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
  });
});
