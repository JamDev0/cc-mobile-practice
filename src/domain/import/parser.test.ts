/**
 * Parser tests per specs/03-import-review-grading-ralph-spec.md
 * IRG-01, IRG-02, IRG-03, IRG-04, IRG-05, EC-01, EC-02, EC-03, EC-04.
 */

import { describe, it, expect } from "vitest";
import {
  normalizeInput,
  detectFormat,
  parseFormatA,
  parseFormatB,
  parseGabarito,
} from "./parser";

describe("normalizeInput", () => {
  it("trims and uppercases (N-01, N-02)", () => {
    const { normalized } = normalizeInput("  1a,2b  ");
    expect(normalized).toBe("1A,2B");
  });

  it("replaces semicolon with comma (N-03)", () => {
    const { normalized } = normalizeInput("1:A;2:B");
    expect(normalized).toBe("1:A,2:B");
  });

  it("strips spaces around separators (N-05)", () => {
    const { normalized } = normalizeInput("1A , 2B , 3C");
    expect(normalized).toBe("1A,2B,3C");
  });
});

describe("detectFormat", () => {
  it("Format A when majority digit+token pairs", () => {
    expect(detectFormat("1A,2B,3C")).toEqual({ mode: "A" });
    expect(detectFormat("1A,2B,C")).toEqual({ mode: "A" });
  });

  it("Format B when only tokens", () => {
    expect(detectFormat("A,B,C,D,E")).toEqual({ mode: "B" });
  });

  it("ambiguous for empty", () => {
    expect(detectFormat("")).toEqual({ mode: "ambiguous" });
    expect(detectFormat("   ")).toEqual({ mode: "ambiguous" });
  });
});

describe("parseFormatA", () => {
  it("IRG-01: Import valid Format A - all entries persisted correctly", () => {
    const { entries, report } = parseFormatA("1A,2B,3C");
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
      { questionNumber: 3, answerToken: "C" },
    ]);
    expect(report.importedCount).toBe(3);
    expect(report.skippedCount).toBe(0);
  });

  it("parses 1:A; 2:B style after normalization", () => {
    const { normalized } = normalizeInput("1:A; 2:B; 3:C");
    const { entries } = parseFormatA(normalized);
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
      { questionNumber: 3, answerToken: "C" },
    ]);
  });

  it("EC-03: duplicate question numbers - keep last + warning", () => {
    const { entries, report } = parseFormatA("1A,2B,1C");
    expect(entries).toEqual(
      expect.arrayContaining([
        { questionNumber: 1, answerToken: "C" },
        { questionNumber: 2, answerToken: "B" },
      ])
    );
    expect(entries).toHaveLength(2);
    expect(report.warnings.some((w) => w.reason === "DUPLICATE_GABARITO_ENTRY")).toBe(true);
  });

  it("EC-04: huge question numbers accepted if >= 1", () => {
    const { entries } = parseFormatA("999999A");
    expect(entries).toEqual([{ questionNumber: 999999, answerToken: "A" }]);
  });

  it("IRG-03: mixed valid/invalid - valid imported, warnings shown", () => {
    const { entries, report } = parseFormatA("1A,1X,2B,3Z,4C");
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
      { questionNumber: 4, answerToken: "C" },
    ]);
    expect(report.importedCount).toBe(3);
    expect(report.skippedCount).toBe(2);
    expect(report.warnings.filter((w) => w.reason === "INVALID_TOKEN")).toHaveLength(2);
  });

  it("invalid question number", () => {
    const { entries, report } = parseFormatA("0A,-1B,1C");
    expect(entries).toEqual([{ questionNumber: 1, answerToken: "C" }]);
    expect(report.warnings.some((w) => w.reason === "INVALID_QUESTION_NUMBER")).toBe(true);
  });

  it("malformed pair", () => {
    const { entries, report } = parseFormatA("1A,foo,2B");
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
    ]);
    expect(report.warnings.some((w) => w.reason === "MALFORMED_PAIR" && w.rawValue === "foo")).toBe(true);
  });
});

describe("parseFormatB", () => {
  it("IRG-02: Import valid Format B with start=5 - first entry maps to Q5", () => {
    const { entries, report } = parseFormatB("A,B,D,A,C", 5);
    expect(entries).toEqual([
      { questionNumber: 5, answerToken: "A" },
      { questionNumber: 6, answerToken: "B" },
      { questionNumber: 7, answerToken: "D" },
      { questionNumber: 8, answerToken: "A" },
      { questionNumber: 9, answerToken: "C" },
    ]);
    expect(report.importedCount).toBe(5);
  });

  it("EC-02: invalid start number - block", () => {
    const { entries, report } = parseFormatB("A,B", 0);
    expect(entries).toHaveLength(0);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it("skips invalid tokens - valid tokens get sequential numbers", () => {
    const { entries, report } = parseFormatB("A,Z,B,X,C", 1);
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
      { questionNumber: 3, answerToken: "C" },
    ]);
    expect(report.skippedCount).toBe(2);
  });
});

describe("parseGabarito", () => {
  it("EC-01: empty text - empty result", () => {
    const { entries, report } = parseGabarito("   ", { format: "A" });
    expect(entries).toHaveLength(0);
    expect(report.importedCount).toBe(0);
  });

  it("Format A full flow", () => {
    const { entries, report } = parseGabarito(" 1a , 2b , 3c ", { format: "A" });
    expect(entries).toEqual([
      { questionNumber: 1, answerToken: "A" },
      { questionNumber: 2, answerToken: "B" },
      { questionNumber: 3, answerToken: "C" },
    ]);
    expect(report.importedCount).toBe(3);
  });

  it("Format B with startQuestionNumber", () => {
    const { entries } = parseGabarito("A,B,C", {
      format: "B",
      startQuestionNumber: 10,
    });
    expect(entries).toEqual([
      { questionNumber: 10, answerToken: "A" },
      { questionNumber: 11, answerToken: "B" },
      { questionNumber: 12, answerToken: "C" },
    ]);
  });
});
