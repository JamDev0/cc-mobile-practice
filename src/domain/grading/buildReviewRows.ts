/**
 * Review row construction per specs/01-domain-data-model-ralph-spec.md section 9
 * and specs/03-import-review-grading-ralph-spec.md section 10.
 * Sorted ascending by questionNumber; full userMarkers list retained for conflict inspection.
 */

import type {
  AnswerToken,
  GabaritoEntry,
  Marker,
  ReviewRow,
  RowStatus,
} from "@/domain/models/types";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
import { resolveEffectiveUserToken } from "./resolveEffectiveUserToken";

function classifyRowStatus(
  markers: Marker[],
  gabaritoToken: AnswerToken | null
): RowStatus {

  // 1. Conflict (markerCount > 1) -> conflict
  if (markers.length > 1) return "conflict";

  // 2. Gabarito missing -> not_gradable
  if (gabaritoToken === null) return "not_gradable";

  // 3. Marker missing or marker token '-' with non-blank gabarito -> blank
  const effectiveUser = resolveEffectiveUserToken(markers);
  if (effectiveUser === null) return "blank";
  if (effectiveUser === "-" && gabaritoToken !== "-") return "blank";

  // 4. Marker token equals gabarito token -> correct
  if (effectiveUser === gabaritoToken) return "correct";

  // 5. Otherwise -> wrong
  return "wrong";
}

export function buildReviewRows(
  markers: Marker[],
  gabaritoEntries: GabaritoEntry[]
): ReviewRow[] {
  const derivedMarkers = deriveMarkerStatuses(markers);

  const markersByQuestion = new Map<number, Marker[]>();
  for (const m of derivedMarkers) {
    const arr = markersByQuestion.get(m.questionNumber) ?? [];
    arr.push(m);
    markersByQuestion.set(m.questionNumber, arr);
  }

  const gabaritoByQuestion = new Map<number, AnswerToken>();
  for (const g of gabaritoEntries) {
    gabaritoByQuestion.set(g.questionNumber, g.answerToken);
  }

  const allQuestionNumbers = new Set<number>([
    ...markersByQuestion.keys(),
    ...gabaritoByQuestion.keys(),
  ]);

  const rows: ReviewRow[] = [];
  for (const questionNumber of allQuestionNumbers) {
    const userMarkers = markersByQuestion.get(questionNumber) ?? [];
    const gabaritoToken = gabaritoByQuestion.get(questionNumber) ?? null;
    const effectiveUserToken = resolveEffectiveUserToken(userMarkers);
    const status = classifyRowStatus(userMarkers, gabaritoToken);

    rows.push({
      questionNumber,
      userMarkers,
      effectiveUserToken,
      gabaritoToken,
      status,
    });
  }

  rows.sort((a, b) => a.questionNumber - b.questionNumber);
  return rows;
}
