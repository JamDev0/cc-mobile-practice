/**
 * Grading engine per specs/01-domain-data-model-ralph-spec.md section 8
 * and specs/03-import-review-grading-ralph-spec.md section 10.
 * Deterministic snapshot from markers + gabarito.
 */

import type { GabaritoEntry, GradingSnapshot, Marker } from "@/domain/models/types";
import { buildReviewRows } from "./buildReviewRows";

export function computeGradingSnapshot(
  sessionId: string,
  markers: Marker[],
  gabaritoEntries: GabaritoEntry[]
): GradingSnapshot {
  const rows = buildReviewRows(markers, gabaritoEntries);

  let gradableCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let blankCount = 0;
  let conflictExcludedCount = 0;
  let notGradableCount = 0;

  for (const row of rows) {
    switch (row.status) {
      case "conflict":
        conflictExcludedCount++;
        break;
      case "not_gradable":
        notGradableCount++;
        break;
      case "correct":
        gradableCount++;
        correctCount++;
        break;
      case "wrong":
        gradableCount++;
        wrongCount++;
        break;
      case "blank":
        gradableCount++;
        wrongCount++;
        blankCount++;
        break;
    }
  }

  const accuracy =
    gradableCount > 0 ? correctCount / gradableCount : null;

  return {
    sessionId,
    computedAt: Date.now(),
    gradableCount,
    correctCount,
    wrongCount,
    blankCount,
    conflictExcludedCount,
    notGradableCount,
    accuracy,
    rows,
  };
}
