import type { GradingSnapshot, ReviewRow, Session } from "@/domain/models/types";

export type TabId = "solve" | "review" | "session";

export interface SessionShellProps {
  sessionId: string;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  children: React.ReactNode;
}

export interface SessionsLayoutProps {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  onCreateClick: () => void;
}

export interface ReviewDisplayProps {
  snapshot: GradingSnapshot;
  onQuestionNumberTap: (row: ReviewRow) => void;
  onUserAnswerTap: (row: ReviewRow) => void;
  onGabaritoTap: (questionNumber: number) => void;
  onDeleteTap: (row: ReviewRow) => void;
  onImportClick: () => void;
  getCommentByQuestion: (qn: number) => string | null;
  expandedCommentRow: number | null;
  onToggleComment: (qn: number) => void;
  onSaveComment: (qn: number, comment: string) => Promise<void>;
  writeError: string | null;
  clearWriteError: () => void;
}
