import { describe, it, expect } from "vitest";
import { deriveMarkerStatuses } from "./deriveMarkerStatuses";
import type { Marker } from "@/domain/models/types";

function mkMarker(overrides: Partial<Marker> & Pick<Marker, "id" | "questionNumber">): Marker {
  const { id, questionNumber, ...rest } = overrides;
  return {
    id,
    sessionId: "s1",
    pageNumber: 1,
    xPct: 0.5,
    yPct: 0.5,
    questionNumber,
    answerToken: "A",
    status: "valid",
    createdAt: 0,
    updatedAt: 0,
    ...rest,
  };
}

describe("deriveMarkerStatuses", () => {
  it("marks single marker as valid", () => {
    const markers: Marker[] = [
      mkMarker({ id: "m1", questionNumber: 1 }),
    ];
    const result = deriveMarkerStatuses(markers);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("valid");
  });

  it("marks duplicate question numbers as conflict", () => {
    const markers: Marker[] = [
      mkMarker({ id: "m1", questionNumber: 1 }),
      mkMarker({ id: "m2", questionNumber: 1 }),
    ];
    const result = deriveMarkerStatuses(markers);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("conflict");
    expect(result[1].status).toBe("conflict");
  });

  it("handles three markers on same question", () => {
    const markers: Marker[] = [
      mkMarker({ id: "m1", questionNumber: 5 }),
      mkMarker({ id: "m2", questionNumber: 5 }),
      mkMarker({ id: "m3", questionNumber: 5 }),
    ];
    const result = deriveMarkerStatuses(markers);
    expect(result.every((m) => m.status === "conflict")).toBe(true);
  });

  it("valid questions stay valid when others conflict", () => {
    const markers: Marker[] = [
      mkMarker({ id: "m1", questionNumber: 1 }),
      mkMarker({ id: "m2", questionNumber: 1 }),
      mkMarker({ id: "m3", questionNumber: 2 }),
    ];
    const result = deriveMarkerStatuses(markers);
    const m3 = result.find((m) => m.id === "m3");
    expect(m3?.status).toBe("valid");
  });
});
