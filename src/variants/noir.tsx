"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useTheme, THEME_IDS } from "@/shared/theme/ThemeProvider";
import type {
  SessionShellProps,
  SessionsLayoutProps,
  ReviewDisplayProps,
  TabId,
} from "@/variants/types";
import type { RowStatus, ReviewRow } from "@/domain/models/types";

const STATUS_STRIP_MAP: Record<RowStatus, string> = {
  correct: "var(--color-status-correct-fg)",
  wrong: "var(--color-status-wrong-fg)",
  blank: "var(--color-status-blank-fg)",
  conflict: "var(--color-status-conflict-fg)",
  not_gradable: "var(--color-status-notgradable-fg)",
};

const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

// --- NoirHome
export function NoirHome() {
  const { theme, setTheme, meta } = useTheme();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        gap: "2.5rem",
        background: "var(--color-bg)",
        fontFamily: "var(--font-family-mono)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2.5rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
            fontFamily: "var(--font-family-mono)",
            margin: 0,
          }}
        >
          Mobile Practice
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 400,
          }}
        >
          Solve PDF-based exams, capture answers, import answer keys, and review
          your grades.
        </p>
        <Link
          href="/sessions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem 3rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            borderRadius: 50,
            textDecoration: "none",
            fontSize: "1.125rem",
            fontWeight: 600,
            fontFamily: "var(--font-family-mono)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          Open Sessions
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: "2.5rem",
        }}
      >
        {THEME_IDS.map((id) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={isActive}
              aria-label={`Select ${meta[id].label} theme`}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "none",
                background: isActive
                  ? "var(--color-accent)"
                  : "var(--color-border)",
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
    </main>
  );
}

// --- NoirSessions
export function NoirSessions({
  sessions,
  loading,
  error,
  creating,
  createError,
  onCreateClick,
}: SessionsLayoutProps) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "2rem 1.5rem",
        fontFamily: "var(--font-family-mono)",
        background: "var(--color-bg)",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            color: "var(--color-text)",
            fontFamily: "var(--font-family-mono)",
            borderBottom: "2px solid var(--color-accent)",
            paddingBottom: "0.5rem",
            margin: 0,
          }}
        >
          Sessions
        </h1>
        <Link
          href="/"
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          Home
        </Link>
      </div>

      <button
        type="button"
        onClick={onCreateClick}
        disabled={creating}
        style={{
          width: "100%",
          height: 56,
          background: "var(--color-accent)",
          color: "var(--color-accent-text)",
          border: "none",
          borderRadius: 14,
          cursor: creating ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: 600,
          fontFamily: "var(--font-family-mono)",
          opacity: creating ? 0.6 : 1,
          boxShadow: "var(--shadow-lg)",
          marginBottom: "2rem",
        }}
      >
        {creating ? "Creating..." : "Create session from PDF"}
      </button>

      {(error || createError) && (
        <p
          style={{
            color: "var(--color-danger)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {(error ?? createError) ?? ""}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface)",
            }}
          >
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface)",
            }}
          >
            No sessions yet. Create one from a PDF above.
          </div>
        ) : (
          sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              style={{
                display: "block",
                padding: "1.25rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderLeft: "3px solid var(--color-accent)",
                borderRadius: "var(--radius-lg)",
                color: "var(--color-text)",
                textDecoration: "none",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  letterSpacing: "var(--letter-spacing-heading)",
                }}
              >
                {s.title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.5rem",
                  fontFamily: "var(--font-family-mono)",
                }}
              >
                {new Date(s.updatedAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

// --- NoirSessionShell
export function NoirSessionShell({
  sessionId,
  activeTab,
  onTabChange,
  children,
}: SessionShellProps) {
  const hashPrefix = sessionId.slice(0, 8);

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-family-mono)",
        background: "var(--color-bg)",
      }}
    >
      <header
        style={{
          padding: "0.5rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-family-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "50%",
          }}
        >
          {hashPrefix}...
        </span>
        <Link
          href="/sessions"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-accent)",
            textDecoration: "none",
          }}
        >
          Switch
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: activeTab === "solve" ? "0 0 64px" : "1.25rem 1.25rem 64px",
          overflow: activeTab === "solve" ? undefined : "auto",
        }}
      >
        {children}
      </div>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          padding: "0.75rem 1rem",
          background: "transparent",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                background: "none",
                border: "none",
                padding: "0.25rem 0.5rem",
                cursor: "pointer",
                fontFamily: "var(--font-family-mono)",
                fontSize: "0.8125rem",
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isActive ? "var(--color-accent)" : "transparent",
                }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// --- NoirCommentTextarea
interface NoirCommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (qn: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function NoirCommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: NoirCommentTextareaProps) {
  const [value, setValue] = useState(initialValue);

  const handleBlur = useCallback(() => {
    void onSave(questionNumber, value);
    onBlur();
  }, [questionNumber, value, onSave, onBlur]);

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="Add a comment..."
      aria-label={`Comment for question ${questionNumber}`}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "1rem",
        border: "1px solid var(--color-input-border)",
        background: "var(--color-input-bg)",
        color: "var(--color-input-text)",
        fontSize: "0.9375rem",
        resize: "vertical",
        fontFamily: "var(--font-family-mono)",
        minHeight: 80,
        borderRadius: "var(--radius-lg)",
      }}
    />
  );
}

// --- NoirReviewDisplay
export function NoirReviewDisplay({
  snapshot,
  onQuestionNumberTap,
  onUserAnswerTap,
  onGabaritoTap,
  onDeleteTap,
  onImportClick,
  getCommentByQuestion,
  expandedCommentRow,
  onToggleComment,
  onSaveComment,
  writeError,
  clearWriteError,
}: ReviewDisplayProps) {
  const accuracyPct =
    snapshot.accuracy != null
      ? Math.round(snapshot.accuracy * 100)
      : null;

  return (
    <div
      style={{
        fontFamily: "var(--font-family-mono)",
        background: "var(--color-bg)",
      }}
    >
      {writeError && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-danger)",
            color: "var(--color-text)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <span style={{ fontSize: "0.875rem" }}>{writeError}</span>
          <button
            type="button"
            onClick={clearWriteError}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "0 0.25rem",
              fontSize: "1.25rem",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {accuracyPct != null && (
          <span
            style={{
              fontSize: "2.5rem",
              fontWeight: "var(--font-weight-heading)",
              letterSpacing: "var(--letter-spacing-heading)",
              color: "var(--color-text)",
            }}
          >
            {accuracyPct}%
          </span>
        )}
        <button
          type="button"
          onClick={onImportClick}
          style={{
            padding: "0.5rem 1.25rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            borderRadius: 50,
            cursor: "pointer",
            fontSize: "0.9375rem",
            fontWeight: 600,
            fontFamily: "var(--font-family-mono)",
          }}
        >
          Import gabarito
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          color: "var(--color-text-secondary)",
          fontSize: "0.9375rem",
        }}
      >
        <span>Correct: {snapshot.correctCount}</span>
        <span>Wrong: {snapshot.wrongCount}</span>
        <span>Blank: {snapshot.blankCount}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {snapshot.rows.map((row) => (
          <NoirReviewCard
            key={row.questionNumber}
            row={row}
            onQuestionNumberTap={onQuestionNumberTap}
            onUserAnswerTap={onUserAnswerTap}
            onGabaritoTap={onGabaritoTap}
            onDeleteTap={onDeleteTap}
            getCommentByQuestion={getCommentByQuestion}
            expandedCommentRow={expandedCommentRow}
            onToggleComment={onToggleComment}
            onSaveComment={onSaveComment}
          />
        ))}
      </div>
    </div>
  );
}

interface NoirReviewCardProps {
  row: ReviewRow;
  onQuestionNumberTap: (row: ReviewRow) => void;
  onUserAnswerTap: (row: ReviewRow) => void;
  onGabaritoTap: (questionNumber: number) => void;
  onDeleteTap: (row: ReviewRow) => void;
  getCommentByQuestion: (qn: number) => string | null;
  expandedCommentRow: number | null;
  onToggleComment: (qn: number) => void;
  onSaveComment: (qn: number, comment: string) => Promise<void>;
}

function NoirReviewCard({
  row,
  onQuestionNumberTap,
  onUserAnswerTap,
  onGabaritoTap,
  onDeleteTap,
  getCommentByQuestion,
  expandedCommentRow,
  onToggleComment,
  onSaveComment,
}: NoirReviewCardProps) {
  const statusStripColor = STATUS_STRIP_MAP[row.status];
  const userToken = row.effectiveUserToken ?? "-";
  const gabToken = row.gabaritoToken ?? "-";
  const hasComment = !!getCommentByQuestion(row.questionNumber);
  const isExpanded = expandedCommentRow === row.questionNumber;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: "1rem",
          background: "var(--color-surface)",
          borderRadius: 14,
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            minWidth: 56,
          }}
        >
          <button
            type="button"
            onClick={() => onQuestionNumberTap(row)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "1.5rem",
              fontWeight: "var(--font-weight-heading)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            {row.questionNumber}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem 0",
            borderLeft: "1px solid var(--color-border)",
            borderRight: "1px solid var(--color-border)",
            paddingLeft: "1rem",
            paddingRight: "1rem",
          }}
        >
          <button
            type="button"
            onClick={() => onUserAnswerTap(row)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--color-text)",
              fontSize: "1rem",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            {userToken}
          </button>
          <span
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            vs
          </span>
          <button
            type="button"
            onClick={() => onGabaritoTap(row.questionNumber)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "1rem",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            {gabToken}
          </button>
        </div>

        <div
          style={{
            width: 4,
            background: statusStripColor,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "0.5rem",
          color: "var(--color-text-muted)",
          fontSize: "0.8125rem",
          paddingLeft: "0.25rem",
        }}
      >
        <button
          type="button"
          onClick={() => onDeleteTap(row)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => onToggleComment(row.questionNumber)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: hasComment
              ? "var(--color-accent)"
              : "var(--color-text-muted)",
            fontFamily: "var(--font-family-mono)",
            fontWeight: hasComment ? 600 : 400,
          }}
        >
          Comment
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "1rem",
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <NoirCommentTextarea
            questionNumber={row.questionNumber}
            initialValue={getCommentByQuestion(row.questionNumber) ?? ""}
            onSave={onSaveComment}
            onBlur={() => onToggleComment(row.questionNumber)}
          />
        </div>
      )}
    </div>
  );
}
