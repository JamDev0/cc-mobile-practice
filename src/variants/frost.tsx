"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useTheme, THEME_IDS, type ThemeId } from "@/shared/theme/ThemeProvider";
import type {
  SessionShellProps,
  SessionsLayoutProps,
  ReviewDisplayProps,
  TabId,
} from "@/variants/types";
import type { RowStatus, ReviewRow } from "@/domain/models/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

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

// --- FrostHome
export function FrostHome() {
  const { theme, setTheme, meta } = useTheme();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        fontFamily: "var(--font-family)",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: "3rem 2rem",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: 4,
              height: 40,
              borderRadius: 2,
              background: "var(--color-accent)",
              flexShrink: 0,
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: "var(--font-weight-heading)",
                letterSpacing: "var(--letter-spacing-heading)",
                color: "var(--color-text)",
              }}
            >
              Mobile Practice
            </h1>
            <p
              style={{
                margin: "0.5rem 0 1.5rem 0",
                fontSize: "0.9375rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Solve PDF-based exams, capture answers, import answer keys, and
              review your grades.
            </p>
          </div>
        </div>

        <Link
          href="/sessions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.625rem 1.25rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            borderRadius: "var(--radius-lg)",
            fontSize: "0.9375rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Go to Sessions
        </Link>

        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Theme
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {THEME_IDS.map((id) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id as ThemeId)}
                  aria-pressed={isActive}
                  aria-label={`Select ${meta[id].label} theme`}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: isActive
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                    color: isActive
                      ? "var(--color-accent-text)"
                      : "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: "var(--font-family)",
                  }}
                >
                  {meta[id].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

// --- FrostSessions
export function FrostSessions({
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
        fontFamily: "var(--font-family)",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "var(--font-weight-heading)",
              letterSpacing: "var(--letter-spacing-heading)",
              color: "var(--color-text)",
            }}
          >
            Sessions
          </h1>
          <Link
            href="/"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-accent)",
              textDecoration: "none",
              fontWeight: 500,
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
            padding: "0.5rem 1rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            borderRadius: "var(--radius-lg)",
            cursor: creating ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--font-family)",
            boxShadow: "var(--shadow-sm)",
            opacity: creating ? 0.7 : 1,
          }}
        >
          Create session
        </button>

        {(error || createError) && (
          <p
            style={{
              color: "var(--color-danger)",
              fontSize: "0.8125rem",
              marginTop: "0.75rem",
            }}
          >
            {(error ?? createError) ?? ""}
          </p>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          {loading ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.875rem",
              }}
            >
              Loading…
            </p>
          ) : sessions.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.875rem",
                textAlign: "center",
                padding: "2rem 0",
              }}
            >
              No sessions yet
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {sessions.map((s) => (
                <li
                  key={s.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <Link
                    href={`/sessions/${s.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.875rem 0",
                      color: "var(--color-text)",
                      textDecoration: "none",
                      fontSize: "0.9375rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        color: "var(--color-text)",
                      }}
                    >
                      {s.title}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-family-mono)",
                      }}
                    >
                      {new Date(s.updatedAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

// --- FrostSessionShell
export function FrostSessionShell({
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
        fontFamily: "var(--font-family)",
      }}
    >
      <header
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: "var(--font-weight-heading)",
              letterSpacing: "var(--letter-spacing-heading)",
              color: "var(--color-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hashPrefix}…
          </h1>
          <Link
            href="/sessions"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-accent)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Switch
          </Link>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "var(--color-surface-alt)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: 2,
              gap: 2,
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
                    padding: "0.5rem 1rem",
                    background: isActive
                      ? "var(--color-accent)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-accent-text)"
                      : "var(--color-text-secondary)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: "var(--font-family)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: activeTab === "solve" ? 0 : "1rem 1.25rem",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// --- FrostReviewDisplay
export function FrostReviewDisplay({
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
      }}
    >
      {writeError && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--color-danger)",
            color: "var(--color-danger-text)",
            marginBottom: "1rem",
            borderRadius: "var(--radius-lg)",
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
              fontSize: "1.25rem",
              lineHeight: 1,
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
          marginBottom: "1rem",
        }}
      >
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
        <button
          type="button"
          onClick={onImportClick}
          style={{
            padding: "0.5rem 1rem",
            background: "transparent",
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            borderRadius: "var(--radius-lg)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--font-family)",
          }}
        >
          Import gabarito
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            padding: "0.25rem 0.625rem",
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Correct: {snapshot.correctCount}
        </span>
        <span
          style={{
            padding: "0.25rem 0.625rem",
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Wrong: {snapshot.wrongCount}
        </span>
        <span
          style={{
            padding: "0.25rem 0.625rem",
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Blank: {snapshot.blankCount}
        </span>
      </div>

      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "0.625rem 0.75rem",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "0.625rem 0.75rem",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                You
              </th>
              <th
                style={{
                  padding: "0.625rem 0.75rem",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                Key
              </th>
              <th
                style={{
                  padding: "0.625rem 0.75rem",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "0.625rem 0.75rem",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row, index) => (
              <FrostReviewRow
                key={row.questionNumber}
                row={row}
                index={index}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FrostReviewRowProps {
  row: ReviewRow;
  index: number;
  onQuestionNumberTap: (row: ReviewRow) => void;
  onUserAnswerTap: (row: ReviewRow) => void;
  onGabaritoTap: (questionNumber: number) => void;
  onDeleteTap: (row: ReviewRow) => void;
  getCommentByQuestion: (qn: number) => string | null;
  expandedCommentRow: number | null;
  onToggleComment: (qn: number) => void;
  onSaveComment: (qn: number, comment: string) => Promise<void>;
}

function FrostReviewRow({
  row,
  index,
  onQuestionNumberTap,
  onUserAnswerTap,
  onGabaritoTap,
  onDeleteTap,
  getCommentByQuestion,
  expandedCommentRow,
  onToggleComment,
  onSaveComment,
}: FrostReviewRowProps) {
  const statusVars = STATUS_VAR_MAP[row.status];
  const userToken = row.effectiveUserToken ?? "-";
  const gabToken = row.gabaritoToken ?? "-";
  const hasComment = !!getCommentByQuestion(row.questionNumber);
  const isExpanded = expandedCommentRow === row.questionNumber;
  const isOdd = index % 2 === 0;

  return (
    <>
      <tr
        style={{
          background: isOdd ? "var(--color-surface-alt)" : "transparent",
        }}
      >
        <td
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--color-border)",
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
              color: "var(--color-accent)",
              fontFamily: "var(--font-family-mono)",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {row.questionNumber}
          </button>
        </td>
        <td
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--color-border)",
            fontFamily: "var(--font-family-mono)",
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
              fontFamily: "var(--font-family-mono)",
              fontSize: "0.875rem",
            }}
          >
            {userToken}
          </button>
        </td>
        <td
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--color-border)",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          <button
            type="button"
            onClick={() => onGabaritoTap(row.questionNumber)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-family-mono)",
              fontSize: "0.875rem",
            }}
          >
            {gabToken}
          </button>
        </td>
        <td
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.5rem",
              background: statusVars.bg,
              color: statusVars.fg,
              borderRadius: 12,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {STATUS_LABELS[row.status]}
          </span>
        </td>
        <td
          style={{
            padding: "0.5rem 0.75rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => onDeleteTap(row)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--color-text-muted)",
                fontSize: "0.75rem",
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
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span aria-hidden>💬</span>
              Comment
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr
          style={{
            background: isOdd ? "var(--color-surface-alt)" : "transparent",
          }}
        >
          <td
            colSpan={5}
            style={{
              padding: "0 0.75rem 0.5rem 0.75rem",
              borderBottom: "1px solid var(--color-border)",
              verticalAlign: "top",
            }}
          >
            <FrostCommentTextarea
              questionNumber={row.questionNumber}
              initialValue={getCommentByQuestion(row.questionNumber) ?? ""}
              onSave={onSaveComment}
              onBlur={() => onToggleComment(row.questionNumber)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

interface FrostCommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (qn: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function FrostCommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: FrostCommentTextareaProps) {
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
        padding: "0.5rem 0.75rem",
        border: "1px solid var(--color-input-border)",
        background: "var(--color-input-bg)",
        color: "var(--color-input-text)",
        fontSize: "0.875rem",
        resize: "vertical",
        fontFamily: "var(--font-family)",
        minHeight: 60,
        borderRadius: "var(--radius-md)",
        marginTop: "0.5rem",
      }}
    />
  );
}
