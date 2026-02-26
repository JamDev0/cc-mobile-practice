/**
 * Conflict derivation per specs/01-domain-data-model-ralph-spec.md section 7.2.
 * INV-07: Conflict status derived, not manually trusted.
 */

import type { Marker } from "@/domain/models/types";

export function deriveMarkerStatuses(markers: Marker[]): Marker[] {
  const byQuestion = new Map<number, Marker[]>();
  for (const marker of markers) {
    const arr = byQuestion.get(marker.questionNumber) ?? [];
    arr.push(marker);
    byQuestion.set(marker.questionNumber, arr);
  }
  return markers.map((marker) => {
    const siblings = byQuestion.get(marker.questionNumber) ?? [];
    const isConflict = siblings.length > 1;
    return { ...marker, status: isConflict ? "conflict" : "valid" };
  });
}
