/**
 * Effective user token resolution per specs/01-domain-data-model-ralph-spec.md section 7.3.
 * V1 policy: exactly one marker -> use its token; else null.
 */

import type { AnswerToken } from "@/domain/models/types";
import type { Marker } from "@/domain/models/types";

export function resolveEffectiveUserToken(
  markersForQuestion: Marker[]
): AnswerToken | null {
  if (markersForQuestion.length !== 1) return null;
  return markersForQuestion[0].answerToken;
}
