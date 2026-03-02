"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import type {
  SessionShellProps,
  SessionsLayoutProps,
  ReviewDisplayProps,
  TabId,
} from "@/variants/types";
import type { RowStatus, ReviewRow } from "@/domain/models/types";

const STATUS_LABELS: Record<RowStatus, string> = {
  correct: "Correct",
  wrong: "Wrong",
  blank: "Blank",
  conflict: "Conflict",
  not_gradable: "N/A",
};

const STATUS_VAR_MAP: Record<RowStatus, { bg: string; fg: string }> = {
  correct: {
    bg: "var(--color-status-correct-bg)",
    fg: "var(--color-status-correct-fg)",
  },
  wrong: {
    bg: "var(--color-status-wrong-bg)",
    fg: "var(--color-status-wrong-fg)",
  },
  blank: {
    bg: "var(--color-status-blank-bg)",
    fg: "var(--color-status-blank-fg)",
  },
  conflict: {
    bg: "var(--color-status-conflict-bg)",
    fg: "var(--color-status-conflict-fg)",
  },
  not_gradable: {
    bg: "var(--color-status-notgradable-bg)",
    fg: "var(--color-status-notgradable-fg)",
  },
};

// --- TerraSessions
const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

export function TerraSessions({
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
        padding: "1.5rem",
        maxWidth: 520,
        margin: "0 auto",
        fontFamily: "var(--font-family)",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "var(--font-weight-heading)",
          letterSpacing: "var(--letter-spacing-heading)",
          color: "var(--color-text)",
          marginBottom: "1.5rem",
        }}
      >
        Sessions
      </h1>

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
          borderRadius: 16,
          cursor: creating ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: 600,
          opacity: creating ? 0.6 : 1,
          boxShadow: "var(--shadow-md)",
          marginBottom: "1.5rem",
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
            padding: "1rem",
            background: "var(--color-danger-soft)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {(error ?? createError) ?? ""}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div
            style={{
              padding: "2.5rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              background: "var(--color-surface)",
              borderRadius: 20,
              boxShadow: "var(--shadow-md)",
            }}
          >
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              border: "2px dashed var(--color-border)",
              borderRadius: 20,
              color: "var(--color-text-muted)",
              fontSize: "0.9375rem",
              background: "var(--color-surface-alt)",
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
                borderRadius: 16,
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-md)",
                color: "var(--color-text)",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
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

// --- TerraSessionShell
export function TerraSessionShell({
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
        fontFamily: "var(--font-family)",
      }}
    >
      <header
        style={{
          padding: "1rem 1.25rem",
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            {hashPrefix}...
          </span>
          <Link
            href="/sessions"
            data-testid="switch-session-link-header"
            aria-label="Switch session"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-accent)",
              textDecoration: "none",
              fontWeight: 500,
              minWidth: 44,
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Switch
          </Link>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: activeTab === "solve" ? "0 0 80px" : "1.25rem 1.25rem 80px",
          overflow: activeTab === "solve" ? undefined : "auto",
        }}
      >
        {children}
      </div>

      <nav
        role="tablist"
        style={{
          position: "fixed",
          bottom: 12,
          left: 16,
          right: 16,
          zIndex: 100,
          display: "flex",
          background: "var(--color-surface)",
          borderRadius: 28,
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
          padding: "6px",
          gap: "4px",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                background: isActive
                  ? "var(--color-accent-soft)"
                  : "transparent",
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
                border: "none",
                borderRadius: 20,
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                fontFamily: "var(--font-family)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// --- TerraCommentTextarea
interface TerraCommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (qn: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function TerraCommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: TerraCommentTextareaProps) {
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
      data-testid={`comment-textarea-Q${questionNumber}`}
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
        fontFamily: "var(--font-family)",
        minHeight: 80,
        borderRadius: "var(--radius-lg)",
        marginTop: "1rem",
      }}
    />
  );
}

// --- TerraReviewDisplay
export function TerraReviewDisplay({
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
        fontFamily: "var(--font-family)",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {writeError && (
        <div
          role="alert"
          style={{
            padding: "1rem 1.25rem",
            background: "var(--color-danger-soft)",
            color: "var(--color-danger)",
            marginBottom: "1.25rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{writeError}</span>
          <button
            type="button"
            onClick={clearWriteError}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "0 0.5rem",
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
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          onClick={onImportClick}
          style={{
            padding: "0.75rem 1.25rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            borderRadius: "var(--radius-xl)",
            cursor: "pointer",
            fontSize: "0.9375rem",
            fontWeight: 600,
            fontFamily: "var(--font-family)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          Import gabarito
        </button>
        {accuracyPct != null && (
          <span
            style={{
              fontSize: "2rem",
              fontWeight: "var(--font-weight-heading)",
              letterSpacing: "var(--letter-spacing-heading)",
              color: "var(--color-text)",
            }}
          >
            {accuracyPct}%
          </span>
        )}
      </div>

      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "0.9375rem",
          marginBottom: "1.5rem",
        }}
      >
        Correct: {snapshot.correctCount} · Wrong: {snapshot.wrongCount} · Blank:{" "}
        {snapshot.blankCount}
        {(() => {
          const missingUser = snapshot.rows.filter(
            (r) => r.userMarkers.length === 0 && r.gabaritoToken != null
          ).length;
          const missingGab = snapshot.rows.filter(
            (r) => r.userMarkers.length > 0 && r.gabaritoToken == null
          ).length;
          return (
            <>
              {missingUser > 0 && (
                <span style={{ display: "block", marginTop: "0.25rem" }}>
                  Missing user answers: {missingUser}
                </span>
              )}
              {missingGab > 0 && (
                <span style={{ display: "block", marginTop: "0.25rem" }}>
                  Missing gabarito answers: {missingGab}
                </span>
              )}
            </>
          );
        })()}
      </p>

      <div
        role="table"
        aria-label="Review results"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {snapshot.rows.map((row) => (
          <TerraReviewCard
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

interface TerraReviewCardProps {
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

function TerraReviewCard({
  row,
  onQuestionNumberTap,
  onUserAnswerTap,
  onGabaritoTap,
  onDeleteTap,
  getCommentByQuestion,
  expandedCommentRow,
  onToggleComment,
  onSaveComment,
}: TerraReviewCardProps) {
  const statusVars = STATUS_VAR_MAP[row.status];
  const userToken = row.effectiveUserToken ?? "\u2014";
  const gabToken = row.gabaritoToken ?? "\u2014";
  const hasComment = !!getCommentByQuestion(row.questionNumber);
  const isExpanded = expandedCommentRow === row.questionNumber;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-md)",
        padding: "1rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => onQuestionNumberTap(row)}
          style={{
            minWidth: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-surface-alt)",
            border: "none",
            borderRadius: "var(--radius-lg)",
            cursor: "pointer",
            fontSize: "1.25rem",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          {row.questionNumber}
        </button>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
            <button
              type="button"
              data-testid={`user-answer-Q${row.questionNumber}`}
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
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>You </span>
              <span>{userToken}</span>
            </button>
            <button
              type="button"
              data-testid={`gabarito-Q${row.questionNumber}`}
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
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>Key </span>
              <span>{gabToken}</span>
            </button>
          </div>
        </div>

        <span
          style={{
            background: statusVars.bg,
            color: statusVars.fg,
            padding: "0.375rem 0.75rem",
            borderRadius: "var(--radius-lg)",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          {STATUS_LABELS[row.status]}
        </span>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {row.userMarkers.length > 0 && (
            <button
              type="button"
              data-testid={`delete-Q${row.questionNumber}`}
              aria-label={`Delete answer for question ${row.questionNumber}`}
              onClick={() => onDeleteTap(row)}
              style={{
                padding: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: "0.875rem",
              }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            data-testid={`comment-toggle-Q${row.questionNumber}`}
            aria-label={hasComment ? `Edit comment for question ${row.questionNumber}` : `Add comment for question ${row.questionNumber}`}
            onClick={() => onToggleComment(row.questionNumber)}
            style={{
              padding: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: hasComment
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
              fontSize: "0.875rem",
              fontWeight: hasComment ? 600 : 400,
            }}
          >
            Comment
          </button>
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1rem",
            marginTop: "1rem",
          }}
        >
          <TerraCommentTextarea
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
