/**
 * Coordinate normalization per specs/01-domain-data-model-ralph-spec.md section 7.1.
 * Persist with at least 4 decimal places.
 */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Convert tap position to normalized [0,1] percentages. Persists with 4 decimal places. */
export function tapToPct(
  tapX: number,
  tapY: number,
  renderWidth: number,
  renderHeight: number
): { xPct: number; yPct: number } {
  const xPct = clamp(tapX / renderWidth, 0, 1);
  const yPct = clamp(tapY / renderHeight, 0, 1);
  return {
    xPct: Math.round(xPct * 10000) / 10000,
    yPct: Math.round(yPct * 10000) / 10000,
  };
}

/** Reverse mapping: pct to pixel coordinates. */
export function pctToPixel(
  xPct: number,
  yPct: number,
  renderWidth: number,
  renderHeight: number
): { pixelX: number; pixelY: number } {
  return {
    pixelX: xPct * renderWidth,
    pixelY: yPct * renderHeight,
  };
}
