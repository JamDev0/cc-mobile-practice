/**
 * Invariant guards per specs/01-domain-data-model-ralph-spec.md section 4.
 * INV-02 through INV-06 are enforceable at input validation time.
 */

import { ANSWER_TOKEN_SET } from "./constants";
import type { AnswerToken } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** INV-02: Marker.pageNumber >= 1 */
export function validatePageNumber(pageNumber: number): boolean {
  return Number.isInteger(pageNumber) && pageNumber >= 1;
}

/** INV-03: xPct and yPct in [0,1]. Returns normalized coords. */
export function normalizeCoordinates(
  xPct: number,
  yPct: number
): { xPct: number; yPct: number } {
  return {
    xPct: clamp(xPct, 0, 1),
    yPct: clamp(yPct, 0, 1),
  };
}

/** INV-04: questionNumber >= 1 for Marker */
export function validateMarkerQuestionNumber(questionNumber: number): boolean {
  return Number.isInteger(questionNumber) && questionNumber >= 1;
}

/** INV-05: GabaritoEntry.questionNumber >= 1 */
export function validateGabaritoQuestionNumber(questionNumber: number): boolean {
  return Number.isInteger(questionNumber) && questionNumber >= 1;
}

/** INV-06: answerToken belongs to token set */
export function isValidAnswerToken(value: unknown): value is AnswerToken {
  return typeof value === "string" && ANSWER_TOKEN_SET.has(value);
}
