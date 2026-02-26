/**
 * Solve screen types per specs/02-solve-screen-interaction-ralph-spec.md §6.2.
 */

import type { AnswerToken } from "@/domain/models/types";
import type { Marker } from "@/domain/models/types";

export interface PendingMarker {
  pageNumber: number;
  xPct: number;
  yPct: number;
  suggestedQuestionNumber: number;
  selectedToken: AnswerToken | null;
}

export interface JumpRequest {
  sessionId: string;
  markerId: string;
  pageNumber: number;
  /** When set, Solve opens edit sheet for this marker after jump (tap user answer from Review) */
  openEditMarkerId?: string;
}

export type EditMarkerTarget = { marker: Marker } | null;
