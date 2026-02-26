/**
 * Domain constants per specs/01-domain-data-model-ralph-spec.md
 */

import type { AnswerToken } from "./types";

/** Valid answer tokens per INV-06 */
export const ANSWER_TOKENS: readonly AnswerToken[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "-",
] as const;

export const ANSWER_TOKEN_SET = new Set<string>(ANSWER_TOKENS);
