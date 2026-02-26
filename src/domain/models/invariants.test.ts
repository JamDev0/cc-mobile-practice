import { describe, it, expect } from "vitest";
import {
  validatePageNumber,
  normalizeCoordinates,
  validateMarkerQuestionNumber,
  validateGabaritoQuestionNumber,
  isValidAnswerToken,
} from "./invariants";

describe("invariants", () => {
  describe("validatePageNumber", () => {
    it("accepts integers >= 1", () => {
      expect(validatePageNumber(1)).toBe(true);
      expect(validatePageNumber(999)).toBe(true);
    });
    it("rejects 0 and negative", () => {
      expect(validatePageNumber(0)).toBe(false);
      expect(validatePageNumber(-1)).toBe(false);
    });
  });

  describe("normalizeCoordinates", () => {
    it("clamps to [0,1]", () => {
      expect(normalizeCoordinates(1.5, -0.5)).toEqual({ xPct: 1, yPct: 0 });
    });
  });

  describe("validateMarkerQuestionNumber", () => {
    it("accepts integers >= 1", () => {
      expect(validateMarkerQuestionNumber(1)).toBe(true);
    });
    it("rejects 0", () => {
      expect(validateMarkerQuestionNumber(0)).toBe(false);
    });
  });

  describe("validateGabaritoQuestionNumber", () => {
    it("accepts integers >= 1", () => {
      expect(validateGabaritoQuestionNumber(1)).toBe(true);
    });
  });

  describe("isValidAnswerToken", () => {
    it("accepts A,B,C,D,E,-", () => {
      expect(isValidAnswerToken("A")).toBe(true);
      expect(isValidAnswerToken("B")).toBe(true);
      expect(isValidAnswerToken("C")).toBe(true);
      expect(isValidAnswerToken("D")).toBe(true);
      expect(isValidAnswerToken("E")).toBe(true);
      expect(isValidAnswerToken("-")).toBe(true);
    });
    it("rejects invalid tokens", () => {
      expect(isValidAnswerToken("Z")).toBe(false);
      expect(isValidAnswerToken("a")).toBe(false);
      expect(isValidAnswerToken("")).toBe(false);
      expect(isValidAnswerToken(null)).toBe(false);
    });
  });
});
