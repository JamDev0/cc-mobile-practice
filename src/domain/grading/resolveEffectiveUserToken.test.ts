import { describe, it, expect } from "vitest";
import { resolveEffectiveUserToken } from "./resolveEffectiveUserToken";
import type { Marker } from "@/domain/models/types";

function mkMarker(overrides: Partial<Marker> & Pick<Marker, "id">): Marker {
  const { id, answerToken, ...rest } = overrides;
  return {
    id: id ?? "m1",
    sessionId: "s1",
    pageNumber: 1,
    xPct: 0.5,
    yPct: 0.5,
    questionNumber: 1,
    answerToken: answerToken === undefined ? "A" : answerToken,
    status: "valid",
    createdAt: 0,
    updatedAt: 0,
    ...rest,
  };
}

describe("resolveEffectiveUserToken", () => {
  it("returns token when exactly one marker", () => {
    const markers = [mkMarker({ id: "m1", answerToken: "B" })];
    expect(resolveEffectiveUserToken(markers)).toBe("B");
  });

  it("returns null when no markers", () => {
    expect(resolveEffectiveUserToken([])).toBeNull();
  });

  it("returns null when multiple markers (conflict)", () => {
    const markers = [
      mkMarker({ id: "m1", answerToken: "A" }),
      mkMarker({ id: "m2", answerToken: "B" }),
    ];
    expect(resolveEffectiveUserToken(markers)).toBeNull();
  });

  it("handles null answerToken as single marker", () => {
    const markers = [mkMarker({ id: "m1", answerToken: null })];
    expect(resolveEffectiveUserToken(markers)).toBeNull();
  });
});
