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
import type { RowStatus } from "@/domain/models/types";

// --- Status code map for Ink variant (text codes instead of badges)
const STATUS_TO_CODE: Record<RowStatus, string> = {
  correct: "OK",
  wrong: "XX",
  blank: "--",
  conflict: "!!",
  not_gradable: "??",
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

// --- InkHome
export function InkHome() {
  const { theme, setTheme, meta } = useTheme();

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-family-mono)",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            color: "var(--color-accent)",
            fontFamily: "var(--font-family-mono)",
            letterSpacing: "0.02em",
          }}
        >
          &gt; Mobile Practice_
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            marginTop: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          Solve PDF-based exams, capture answers, import answer keys, and review
          your grades.
        </p>
        <Link
          href="/sessions"
          aria-label="Open Sessions"
          style={{
            color: "var(--color-accent)",
            textDecoration: "none",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          $ open-sessions
        </Link>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "2rem",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Theme
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
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
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: isActive
                    ? "2px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
                  background: isActive
                    ? "var(--color-accent-soft)"
                    : "var(--color-surface)",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}

// --- InkSessions
export function InkSessions({
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
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0.75rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--color-text)",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          <span aria-hidden="true">&gt; </span>Sessions
        </h1>
        <Link
          href="/"
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-accent)",
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
          padding: "0.5rem 0",
          background: "none",
          border: "none",
          color: "var(--color-accent)",
          cursor: creating ? "not-allowed" : "pointer",
          fontSize: "0.875rem",
          fontFamily: "var(--font-family-mono)",
          opacity: creating ? 0.6 : 1,
        }}
      >
        <span aria-hidden="true">$ </span>Create session from PDF
      </button>

      {(error || createError) && (
        <p
          style={{
            color: "var(--color-danger)",
            fontSize: "0.8125rem",
            marginTop: "0.5rem",
          }}
        >
          {(error ?? createError) ?? ""}
        </p>
      )}

      <div
        style={{
          marginTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
          paddingTop: "1rem",
        }}
      >
        <h2 style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
          Existing sessions
        </h2>
        {loading ? (
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            Loading sessions...
          </p>
        ) : sessions.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.8125rem",
            }}
          >
            (empty)
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {sessions.map((s) => (
              <li
                key={s.id}
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                }}
              >
                <Link
                  href={`/sessions/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    color: "var(--color-text)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    --
                  </span>
                  <span>{s.title}</span>
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {new Date(s.updatedAt).toISOString().slice(0, 19)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

// --- InkSessionShell
const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

export function InkSessionShell({
  sessionId,
  activeTab,
  onTabChange,
  children,
}: SessionShellProps) {
  const hashPrefix = sessionId.slice(0, 8);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-family-mono)",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0.5rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div role="tablist" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.25rem 0",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-mono)",
                  fontSize: "0.8125rem",
                  color: isActive
                    ? "var(--color-accent)"
                    : "var(--color-text-secondary)",
                  textDecoration: isActive ? "underline" : "none",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "4px",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <Link
          href="/sessions"
          data-testid="switch-session-link-header"
          aria-label="Switch session"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            minWidth: 44,
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          $ switch
        </Link>
      </nav>

      <div
        style={{
          flex: 1,
          padding: "1rem 1.5rem",
          overflow: "auto",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            marginBottom: "1rem",
          }}
        >
          &gt; {hashPrefix}...
        </p>
        {children}
      </div>
    </div>
  );
}

// --- InkReviewDisplay
export function InkReviewDisplay({
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
        fontSize: "0.8125rem",
      }}
    >
      {writeError && (
        <div
          role="alert"
          style={{
            padding: "0.5rem 0.75rem",
            background: "var(--color-danger)",
            color: "var(--color-text)",
            marginBottom: "1rem",
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
              padding: "0 0.25rem",
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
          gap: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={onImportClick}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-accent)",
            cursor: "pointer",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          $ import-gabarito
        </button>
        {accuracyPct != null && (
          <span style={{ color: "var(--color-text-secondary)" }}>
            accuracy: {accuracyPct}%
          </span>
        )}
      </div>

      <p
        style={{
          color: "var(--color-text-muted)",
          marginBottom: "0.5rem",
        }}
      >
        correct:{snapshot.correctCount} wrong:{snapshot.wrongCount} blank:
        {snapshot.blankCount}
      </p>

      {(() => {
        const missingUser = snapshot.rows.filter(r => r.userMarkers.length === 0).length;
        const missingGab = snapshot.rows.filter(r => r.gabaritoToken === null).length;
        if (missingUser === 0 && missingGab === 0) return null;
        return (
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem", fontSize: "0.75rem" }}>
            {missingUser > 0 && <span>Missing user answers: {missingUser} </span>}
            {missingGab > 0 && <span>Missing gabarito answers: {missingGab}</span>}
          </p>
        );
      })()}

      <div
        role="table"
        style={{
          borderTop: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
      >
        <div
          role="row"
          style={{
            display: "grid",
            gridTemplateColumns: "2rem 2.5rem 2.5rem 2rem 2rem 1fr",
            gap: "0.5rem 1rem",
            padding: "0.5rem 0",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            fontSize: "0.6875rem",
          }}
        >
          <span>#</span>
          <span>you</span>
          <span>key</span>
          <span>st</span>
          <span>del</span>
          <span>note</span>
        </div>

        {snapshot.rows.map((row) => {
          const statusCode = STATUS_TO_CODE[row.status];
          const statusVars = STATUS_VAR_MAP[row.status];
          const userToken = row.effectiveUserToken ?? "\u2014";
          const gabToken = row.gabaritoToken ?? "\u2014";
          const hasComment = !!getCommentByQuestion(row.questionNumber);
          const isExpanded = expandedCommentRow === row.questionNumber;

          return (
            <React.Fragment key={row.questionNumber}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2rem 2.5rem 2.5rem 2rem 2rem 1fr",
                  gap: "0.5rem 1rem",
                  padding: "0.375rem 0",
                  borderTop: "1px solid var(--color-border)",
                  alignItems: "center",
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
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    textAlign: "left",
                  }}
                >
                  {row.questionNumber}
                </button>
                <button
                  type="button"
                  onClick={() => onUserAnswerTap(row)}
                  data-testid={`user-answer-Q${row.questionNumber}`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    textAlign: "left",
                  }}
                >
                  {userToken}
                </button>
                <button
                  type="button"
                  onClick={() => onGabaritoTap(row.questionNumber)}
                  data-testid={`gabarito-Q${row.questionNumber}`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    textAlign: "left",
                  }}
                >
                  {gabToken}
                </button>
                <span
                  style={{
                    background: statusVars.bg,
                    color: statusVars.fg,
                    padding: "0 0.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {statusCode}
                </span>
                {row.userMarkers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onDeleteTap(row)}
                    data-testid={`delete-Q${row.questionNumber}`}
                    aria-label={`Delete user answer for question ${row.questionNumber}`}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-family-mono)",
                    }}
                  >
                    x
                  </button>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>{"\u2014"}</span>
                )}
                <button
                  type="button"
                  onClick={() => onToggleComment(row.questionNumber)}
                  data-testid={`comment-toggle-Q${row.questionNumber}`}
                  aria-expanded={isExpanded}
                  aria-label={hasComment ? `Edit comment for question ${row.questionNumber}` : `Add comment for question ${row.questionNumber}`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: hasComment
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  #
                </button>
              </div>

              {isExpanded && (
                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <InkCommentTextarea
                    questionNumber={row.questionNumber}
                    initialValue={
                      getCommentByQuestion(row.questionNumber) ?? ""
                    }
                    onSave={onSaveComment}
                    onBlur={() => onToggleComment(row.questionNumber)}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface InkCommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (qn: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function InkCommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: InkCommentTextareaProps) {
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
      data-testid={`comment-textarea-Q${questionNumber}`}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0.5rem 0.75rem",
        border: "1px solid var(--color-border)",
        background: "var(--color-input-bg)",
        color: "var(--color-input-text)",
        fontSize: "0.8125rem",
        resize: "vertical",
        fontFamily: "var(--font-family-mono)",
        minHeight: 60,
      }}
    />
  );
}
