/**
 * Domain types per specs/01-domain-data-model-ralph-spec.md
 * Single source of truth for canonical contracts.
 */

export type AnswerToken = "A" | "B" | "C" | "D" | "E" | "-";

export type MarkerStatus = "valid" | "conflict" | "orphaned";

export type RowStatus =
  | "correct"
  | "wrong"
  | "blank"
  | "conflict"
  | "not_gradable";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pdfFileName: string;
  pdfMimeType: string;
  pdfByteLength: number;
  pdfSha256: string;
  pageCount: number | null;
  lastInsertedQuestionNumber: number | null;
  ui: SessionUiState;
}

export interface SessionUiState {
  activeTab: "solve" | "review" | "session";
  handedness: "right" | "left";
  zoomMode: "free";
  lastViewedPage: number;
}

export interface Marker {
  id: string;
  sessionId: string;
  pageNumber: number;
  xPct: number;
  yPct: number;
  questionNumber: number;
  answerToken: AnswerToken | null;
  status: MarkerStatus;
  createdAt: number;
  updatedAt: number;
}

export interface GabaritoEntry {
  id: string;
  sessionId: string;
  questionNumber: number;
  answerToken: AnswerToken;
  source: "import" | "manual";
  createdAt: number;
  updatedAt: number;
}

export interface ImportReport {
  totalTokens: number;
  importedCount: number;
  skippedCount: number;
  warnings: ImportWarning[];
}

export interface ImportWarning {
  index: number;
  rawValue: string;
  reason:
    | "INVALID_TOKEN"
    | "INVALID_QUESTION_NUMBER"
    | "MALFORMED_PAIR"
    | "DUPLICATE_GABARITO_ENTRY";
}

export interface GradingSnapshot {
  sessionId: string;
  computedAt: number;
  gradableCount: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  conflictExcludedCount: number;
  notGradableCount: number;
  accuracy: number | null;
  rows: ReviewRow[];
}

export interface ReviewRow {
  questionNumber: number;
  userMarkers: Marker[];
  effectiveUserToken: AnswerToken | null;
  gabaritoToken: AnswerToken | null;
  status: RowStatus;
}

/** Per-answer review comment. Review-only; must not appear in PDF solve view. */
export interface AnswerComment {
  id: string;
  sessionId: string;
  questionNumber: number;
  comment: string;
  updatedAt: number;
}
