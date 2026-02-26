import { describe, it, expect, beforeEach } from "vitest";
import {
  markViewInteractive,
  getMeasurements,
  clearMeasurements,
  NFR_001_THRESHOLD_MS,
} from "./performanceProfiler";

describe("performanceProfiler - NFR-001", () => {
  beforeEach(() => {
    clearMeasurements();
  });

  it("records measurement when markViewInteractive is called", () => {
    markViewInteractive("test-view");
    const measurements = getMeasurements();
    expect(measurements).toHaveLength(1);
    expect(measurements[0].viewName).toBe("test-view");
  });

  it("records durationMs as non-negative number", () => {
    markViewInteractive("sessions");
    const measurements = getMeasurements();
    expect(measurements[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("records multiple view measurements", () => {
    markViewInteractive("sessions");
    markViewInteractive("solve");
    markViewInteractive("review");
    const measurements = getMeasurements();
    expect(measurements).toHaveLength(3);
    expect(measurements.map((m) => m.viewName)).toEqual(["sessions", "solve", "review"]);
  });

  it("clearMeasurements resets state", () => {
    markViewInteractive("sessions");
    expect(getMeasurements()).toHaveLength(1);
    clearMeasurements();
    expect(getMeasurements()).toHaveLength(0);
  });

  it("NFR_001_THRESHOLD_MS is 2500", () => {
    expect(NFR_001_THRESHOLD_MS).toBe(2500);
  });

  it("measurement includes timestamp and navStart", () => {
    markViewInteractive("test");
    const m = getMeasurements()[0];
    expect(m).toHaveProperty("timestamp");
    expect(m).toHaveProperty("navStart");
    expect(typeof m.timestamp).toBe("number");
    expect(typeof m.navStart).toBe("number");
  });
});
