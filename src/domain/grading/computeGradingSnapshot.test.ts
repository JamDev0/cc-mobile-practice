/**
 * Tests per specs/01-domain-data-model-ralph-spec.md section 14 QA Seed Cases
 * and specs/03-import-review-grading-ralph-spec.md Edge Case Catalog.
 */

import { describe, it, expect } from "vitest";
import { computeGradingSnapshot } from "./computeGradingSnapshot";
import type { GabaritoEntry, Marker } from "@/domain/models/types";

const SESSION_ID = "s1";

function mkMarker(overrides: Partial<Marker> & Pick<Marker, "id" | "questionNumber">): Marker {
  const { id, questionNumber, answerToken, ...rest } = overrides;
  return {
    id: id ?? "m1",
    sessionId: SESSION_ID,
    pageNumber: 1,
    xPct: 0.5,
    yPct: 0.5,
    questionNumber,
    answerToken: answerToken ?? "A",
    status: "valid",
    createdAt: 0,
    updatedAt: 0,
    ...rest,
  };
}

function mkGabarito(
  overrides: Partial<GabaritoEntry> & Pick<GabaritoEntry, "id" | "questionNumber" | "answerToken">
): GabaritoEntry {
  const { id, questionNumber, answerToken, ...rest } = overrides;
  return {
    id: id ?? "g1",
    sessionId: SESSION_ID,
    questionNumber,
    answerToken,
    source: "import",
    createdAt: 0,
    updatedAt: 0,
    ...rest,
  };
}

describe("computeGradingSnapshot", () => {
  it("Q-01: No markers, no gabarito - zeroed counters, empty rows", () => {
    const snap = computeGradingSnapshot(SESSION_ID, [], []);
    expect(snap.gradableCount).toBe(0);
    expect(snap.correctCount).toBe(0);
    expect(snap.wrongCount).toBe(0);
    expect(snap.blankCount).toBe(0);
    expect(snap.conflictExcludedCount).toBe(0);
    expect(snap.notGradableCount).toBe(0);
    expect(snap.accuracy).toBeNull();
    expect(snap.rows).toHaveLength(0);
  });

  it("Q-02: Marker Q1=A, gabarito Q1=A - correct=1", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" })];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.correctCount).toBe(1);
    expect(snap.wrongCount).toBe(0);
    expect(snap.gradableCount).toBe(1);
    expect(snap.accuracy).toBe(1);
  });

  it("Q-03: Marker Q1=A, gabarito Q1=B - wrong=1", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" })];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "B" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.correctCount).toBe(0);
    expect(snap.wrongCount).toBe(1);
    expect(snap.gradableCount).toBe(1);
  });

  it("Q-04: Marker Q1='-', gabarito Q1=C - blank=1 wrong=1", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 1, answerToken: "-" })];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "C" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.blankCount).toBe(1);
    expect(snap.wrongCount).toBe(1);
  });

  it("Q-05: Markers Q1=A and Q1=C, gabarito Q1=A - conflictExcluded=1", () => {
    const markers = [
      mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" }),
      mkMarker({ id: "m2", questionNumber: 1, answerToken: "C" }),
    ];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.conflictExcludedCount).toBe(1);
    expect(snap.correctCount).toBe(0);
  });

  it("Q-06: Marker Q5=B, no gabarito Q5 - notGradable=1", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 5, answerToken: "B" })];
    const gabarito: GabaritoEntry[] = [];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.notGradableCount).toBe(1);
  });

  it("EC-06: Gabarito exists, user answer missing - blank/wrong", () => {
    const markers: Marker[] = [];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.blankCount).toBe(1);
    expect(snap.wrongCount).toBe(1);
  });

  it("EC-08: Gabarito token '-', user token '-' - correct", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 1, answerToken: "-" })];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "-" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.correctCount).toBe(1);
  });

  it("EC-09: Gabarito token '-', user token A - wrong", () => {
    const markers = [mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" })];
    const gabarito = [mkGabarito({ id: "g1", questionNumber: 1, answerToken: "-" })];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.wrongCount).toBe(1);
  });

  it("rows sorted ascending by questionNumber", () => {
    const markers = [
      mkMarker({ id: "m3", questionNumber: 3, answerToken: "C" }),
      mkMarker({ id: "m1", questionNumber: 1, answerToken: "A" }),
      mkMarker({ id: "m2", questionNumber: 2, answerToken: "B" }),
    ];
    const gabarito = [
      mkGabarito({ id: "g1", questionNumber: 1, answerToken: "A" }),
      mkGabarito({ id: "g2", questionNumber: 2, answerToken: "B" }),
      mkGabarito({ id: "g3", questionNumber: 3, answerToken: "C" }),
    ];
    const snap = computeGradingSnapshot(SESSION_ID, markers, gabarito);
    expect(snap.rows.map((r) => r.questionNumber)).toEqual([1, 2, 3]);
  });
});
