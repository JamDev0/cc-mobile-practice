/**
 * NFR-001: Mobile render performance — initial view interactive under 2.5s.
 * This module instruments key views to measure time-to-interactive.
 * Use for profiling, dev warnings, and manual verification on typical devices.
 */

export const NFR_001_THRESHOLD_MS = 2500;

type PerfMeasurement = {
  viewName: string;
  durationMs: number;
  navStart: number;
  timestamp: number;
};

const measurements: PerfMeasurement[] = [];

function getNavigationStart(): number {
  if (typeof performance === "undefined") return 0;
  try {
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav && "startTime" in nav) {
      return (nav as PerformanceEntry & { startTime: number }).startTime;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

/**
 * Mark a named view as interactive and record time-from-navigation.
 * Call when the view is ready for user interaction.
 */
export function markViewInteractive(viewName: string): void {
  if (typeof performance === "undefined") return;
  const navStart = getNavigationStart();
  const now = performance.now();
  const durationMs = navStart >= 0 ? now - navStart : now;

  try {
    performance.mark(`perf-interactive-${viewName}`);
    performance.measure(`tti-${viewName}`, {
      start: navStart >= 0 ? navStart : 0,
      duration: durationMs,
    });
  } catch {
    /* marks may fail in some environments */
  }

  measurements.push({ viewName, durationMs, navStart, timestamp: now });

  if (
    process.env.NODE_ENV === "development" &&
    durationMs > NFR_001_THRESHOLD_MS &&
    durationMs < 60000
  ) {
    console.warn(
      `[NFR-001] ${viewName} took ${durationMs.toFixed(0)}ms to become interactive (target: <${NFR_001_THRESHOLD_MS}ms)`
    );
  }
}

/**
 * Return recorded measurements for tests and tooling.
 */
export function getMeasurements(): readonly PerfMeasurement[] {
  return measurements;
}

/**
 * Clear measurements (for test isolation).
 */
export function clearMeasurements(): void {
  measurements.length = 0;
}
