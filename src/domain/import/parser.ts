/**
 * Gabarito import parser per specs/03-import-review-grading-ralph-spec.md.
 * Supports Format A (numbered pairs) and Format B (sequential tokens).
 */

import { ANSWER_TOKEN_SET } from "@/domain/models/constants";
import { validateGabaritoQuestionNumber } from "@/domain/models/invariants";
import type {
  AnswerToken,
  ImportReport,
  ImportWarning,
} from "@/domain/models/types";

export interface ParsedEntry {
  questionNumber: number;
  answerToken: AnswerToken;
}

export type ImportFormat = "A" | "B";

export type FormatDetectionResult =
  | { mode: "A" }
  | { mode: "B" }
  | { mode: "ambiguous" };

/**
 * Normalize input per spec §5 pipeline.
 * N-01: trim, N-02: uppercase, N-03: semicolon→comma, N-04: collapse ,, (warning),
 * N-05: strip spaces around separators.
 */
export function normalizeInput(raw: string): {
  normalized: string;
  warnings: ImportWarning[];
} {
  const warnings: ImportWarning[] = [];
  let s = raw.trim();
  s = s.toUpperCase();
  s = s.replace(/;/g, ",");

  const beforeCollapse = s;
  s = s.replace(/,{2,}/g, (match) => {
    if (match.length > 1) {
      warnings.push({
        index: 0,
        rawValue: match,
        reason: "MALFORMED_PAIR",
      });
    }
    return ",";
  });

  s = s.replace(/\s*,\s*/g, ",").trim();

  return { normalized: s, warnings };
}

/**
 * Detect format per spec §6.1.
 * Format A: majority digit+token pairs (1A pattern).
 * Format B: only token list.
 * Ambiguous: mixed or empty.
 */
export function detectFormat(normalized: string): FormatDetectionResult {
  if (!normalized || /^\s*$/.test(normalized)) return { mode: "ambiguous" };

  const segments = normalized.split(",").map((x) => x.trim()).filter(Boolean);
  if (segments.length === 0) return { mode: "ambiguous" };

  const formatAPattern = /^\d+[ABCDE\-]$/i;
  let formatAMatches = 0;
  let formatBOnly = true;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (formatAPattern.test(seg)) {
      formatAMatches++;
    }
    const isTokenOnly = seg.length === 1 && ANSWER_TOKEN_SET.has(seg);
    if (!isTokenOnly) formatBOnly = false;
  }

  const majority = segments.length / 2;
  if (formatAMatches > majority) return { mode: "A" };
  if (formatBOnly) return { mode: "B" };
  return { mode: "ambiguous" };
}

/**
 * Parse Format A: pair = questionNumber + token.
 * Spec §6.2: split by comma, parse each segment as questionNumber+token.
 * Duplicate question numbers: keep last (EC-03).
 */
export function parseFormatA(normalized: string): {
  entries: ParsedEntry[];
  report: ImportReport;
} {
  const report: ImportReport = {
    totalTokens: 0,
    importedCount: 0,
    skippedCount: 0,
    warnings: [],
  };

  if (!normalized || /^\s*$/.test(normalized)) {
    return { entries: [], report };
  }

  const segments = normalized.split(",").map((s) => s.trim()).filter(Boolean);
  report.totalTokens = segments.length;

  const entries: ParsedEntry[] = [];
  const seenQuestionNumbers = new Map<number, number>();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const pairMatch = seg.match(/^(\d+):?([A-Z\-])$/i);
    if (!pairMatch) {
      report.skippedCount++;
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "MALFORMED_PAIR",
      });
      continue;
    }

    const questionNum = parseInt(pairMatch[1], 10);
    const token = pairMatch[2].toUpperCase();

    if (!validateGabaritoQuestionNumber(questionNum)) {
      report.skippedCount++;
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "INVALID_QUESTION_NUMBER",
      });
      continue;
    }

    if (!ANSWER_TOKEN_SET.has(token)) {
      report.skippedCount++;
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "INVALID_TOKEN",
      });
      continue;
    }

    if (seenQuestionNumbers.has(questionNum)) {
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "DUPLICATE_GABARITO_ENTRY",
      });
    }
    seenQuestionNumbers.set(questionNum, i);
    entries.push({ questionNumber: questionNum, answerToken: token as AnswerToken });
  }

  const byQuestion = new Map<number, ParsedEntry>();
  for (const e of entries) {
    byQuestion.set(e.questionNumber, e);
  }
  const finalEntries = Array.from(byQuestion.values());
  report.importedCount = finalEntries.length;

  return { entries: finalEntries, report };
}

/**
 * Parse Format B: sequential tokens, assign question numbers from start.
 * Spec §6.3: require startQuestionNumber, validate tokens, assign incrementally.
 */
export function parseFormatB(
  normalized: string,
  startQuestionNumber: number
): {
  entries: ParsedEntry[];
  report: ImportReport;
} {
  const report: ImportReport = {
    totalTokens: 0,
    importedCount: 0,
    skippedCount: 0,
    warnings: [],
  };

  if (!validateGabaritoQuestionNumber(startQuestionNumber)) {
    report.warnings.push({
      index: 0,
      rawValue: String(startQuestionNumber),
      reason: "INVALID_QUESTION_NUMBER",
    });
    return { entries: [], report };
  }

  if (!normalized || /^\s*$/.test(normalized)) {
    return { entries: [], report };
  }

  const segments = normalized.split(",").map((s) => s.trim()).filter(Boolean);
  report.totalTokens = segments.length;

  const entries: ParsedEntry[] = [];
  let validIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.length !== 1) {
      report.skippedCount++;
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "INVALID_TOKEN",
      });
      continue;
    }

    const token = seg.toUpperCase();
    if (!ANSWER_TOKEN_SET.has(token)) {
      report.skippedCount++;
      report.warnings.push({
        index: i,
        rawValue: seg,
        reason: "INVALID_TOKEN",
      });
      continue;
    }

    entries.push({
      questionNumber: startQuestionNumber + validIndex,
      answerToken: token as AnswerToken,
    });
    validIndex++;
  }

  report.importedCount = entries.length;
  return { entries, report };
}

/**
 * Parse gabarito text with given format and options.
 * Returns parsed entries and ImportReport.
 */
export function parseGabarito(
  rawText: string,
  options: { format: ImportFormat; startQuestionNumber?: number }
): { entries: ParsedEntry[]; report: ImportReport } {
  const { normalized, warnings } = normalizeInput(rawText);
  const report: ImportReport = {
    totalTokens: 0,
    importedCount: 0,
    skippedCount: 0,
    warnings: [...warnings],
  };

  if (!normalized || /^\s*$/.test(normalized)) {
    return { entries: [], report };
  }

  if (options.format === "A") {
    const result = parseFormatA(normalized);
    return {
      entries: result.entries,
      report: mergeReports(report, result.report),
    };
  }

  const start = options.startQuestionNumber ?? 1;
  const result = parseFormatB(normalized, start);
  return {
    entries: result.entries,
    report: mergeReports(report, result.report),
  };
}

function mergeReports(base: ImportReport, other: ImportReport): ImportReport {
  return {
    totalTokens: other.totalTokens,
    importedCount: other.importedCount,
    skippedCount: base.skippedCount + other.skippedCount,
    warnings: [...base.warnings, ...other.warnings],
  };
}
