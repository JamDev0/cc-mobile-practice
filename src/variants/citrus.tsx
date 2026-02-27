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

const STATUS_DOT_MAP: Record<RowStatus, { bg: string }> = {
  correct: { bg: "var(--color-status-correct-fg)" },
  wrong: { bg: "var(--color-status-wrong-fg)" },
  blank: { bg: "var(--color-status-blank-fg)" },
  conflict: { bg: "var(--color-status-conflict-fg)" },
  not_gradable: { bg: "var(--color-status-notgradable-fg)" },
};

const TABS: { id: TabId; label: string; badge?: number }[] = [
  { id: "solve", label: "Solve", badge: 0 },
  { id: "review", label: "Review", badge: 0 },
  { id: "session", label: "Session", badge: 0 },
];

// --- CitrusHome
export function CitrusHome() {
  const { theme, setTheme, meta } = useTheme();

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        maxWidth: 520,
        margin: "0 auto",
        fontFamily: "var(--font-family-mono)",
      }}
    >
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          letterSpacing: "var(--letter-spacing-heading)",
          color: "var(--color-text)",
          margin: 0,
          marginBottom: "1rem",
          fontFamily: "var(--font-family-mono)",
        }}
      >
        Mobile Practice
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "var(--color-surface)",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Offline-first
          </span>
        </div>
        <div
          style={{
            padding: "0.5rem 0.75rem",
            background: "var(--color-surface)",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            PDF-based
          </span>
        </div>
      </div>

      <Link
        href="/sessions"
        style={{
          display: "block",
          width: "100%",
          padding: "0.75rem 1rem",
          background: "var(--color-accent)",
          color: "var(--color-accent-text)",
          textAlign: "center",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          fontSize: "0.9375rem",
          fontWeight: 600,
          fontFamily: "var(--font-family-mono)",
          marginBottom: "2rem",
        }}
      >
        Open Sessions
      </Link>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--color-text-muted)",
            marginBottom: "0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Theme
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
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
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: isActive
                    ? "2px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
                  background: isActive
                    ? "var(--color-accent-soft)"
                    : "var(--color-surface)",
                  color: isActive
                    ? "var(--color-accent)"
                    : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-mono)",
                }}
              >
                {meta[id].label}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// --- CitrusSessions
export function CitrusSessions({
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
        padding: "1.5rem 1.25rem",
        fontFamily: "var(--font-family-mono)",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
          gap: "0.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--color-text)",
            margin: 0,
            fontFamily: "var(--font-family-mono)",
            letterSpacing: "var(--letter-spacing-heading)",
          }}
        >
          Sessions
        </h1>
        <Link
          href="/"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          Home
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={onCreateClick}
          disabled={creating}
          style={{
            padding: "0.4rem 0.75rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: creating ? "not-allowed" : "pointer",
            fontSize: "0.8125rem",
            fontWeight: 600,
            fontFamily: "var(--font-family-mono)",
            opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {(error || createError) && (
        <p
          style={{
            color: "var(--color-danger)",
            fontSize: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          {(error ?? createError) ?? ""}
        </p>
      )}

      <div style={{ marginTop: "0.5rem" }}>
        {loading ? (
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
              padding: "0.5rem 0",
            }}
          >
            loading...
          </p>
        ) : sessions.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
              padding: "0.5rem 0",
            }}
          >
            No sessions yet.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-family-mono)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{s.title}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  {new Date(s.updatedAt).toISOString().slice(0, 19)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// --- CitrusSessionShell
export function CitrusSessionShell({
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
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0.5rem 1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
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
              fontSize: "0.6875rem",
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            Switch
          </Link>
        </div>
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 6,
            background: "var(--color-surface-alt)",
            borderRadius: "var(--radius-sm)",
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: 6,
                  border: "none",
                  background: isActive
                    ? "var(--color-accent)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-accent-text)"
                    : "var(--color-text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-mono)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tab.label}
                {tab.badge != null && (
                  <span
                    style={{
                      minWidth: 16,
                      padding: "0 4px",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      background: isActive
                        ? "rgba(255,255,255,0.3)"
                        : "var(--color-surface)",
                      color: "inherit",
                      borderRadius: 4,
                      textAlign: "center",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: activeTab === "solve" ? 0 : "1rem 1.25rem",
          overflow: activeTab === "solve" ? undefined : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// --- CitrusCommentTextarea
interface CitrusCommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (qn: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function CitrusCommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: CitrusCommentTextareaProps) {
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
        padding: "0.375rem 0.5rem",
        border: "1px solid var(--color-input-border)",
        background: "var(--color-input-bg)",
        color: "var(--color-input-text)",
        fontSize: "0.75rem",
        resize: "vertical",
        fontFamily: "var(--font-family-mono)",
        minHeight: 48,
        borderRadius: "var(--radius-sm)",
      }}
    />
  );
}

// --- CitrusReviewDisplay
export function CitrusReviewDisplay({
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
        fontSize: "0.75rem",
      }}
    >
      {writeError && (
        <div
          style={{
            padding: "0.375rem 0.5rem",
            background: "var(--color-danger)",
            color: "var(--color-text)",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "var(--radius-sm)",
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
              fontSize: "0.875rem",
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
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={onImportClick}
          style={{
            padding: "0.25rem 0.5rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            border: "none",
            borderRadius: 50,
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 600,
            fontFamily: "var(--font-family-mono)",
          }}
        >
          Import
        </button>
        {accuracyPct != null && (
          <span
            style={{
              padding: "0.125rem 0.375rem",
              background: "var(--color-accent-soft)",
              color: "var(--color-accent)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
            }}
          >
            {accuracyPct}%
          </span>
        )}
        <span
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.6875rem",
          }}
        >
          ✓{snapshot.correctCount} ✗{snapshot.wrongCount} —{snapshot.blankCount}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 36px 36px 32px 32px 36px",
            gap: 0,
            minWidth: "fit-content",
          }}
        >
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            #
          </div>
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            you
          </div>
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            key
          </div>
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            st
          </div>
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            del
          </div>
          <div
            style={{
              padding: "4px 6px",
              fontSize: "0.625rem",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            +
          </div>

          {snapshot.rows.map((row) => {
            const statusDot = STATUS_DOT_MAP[row.status];
            const userToken = row.effectiveUserToken ?? "-";
            const gabToken = row.gabaritoToken ?? "-";
            const hasComment = !!getCommentByQuestion(row.questionNumber);
            const isExpanded = expandedCommentRow === row.questionNumber;

            return (
              <React.Fragment key={row.questionNumber}>
                <button
                  type="button"
                  onClick={() => onQuestionNumberTap(row)}
                  style={{
                    padding: "4px 6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "0.75rem",
                    textAlign: "left",
                  }}
                >
                  {row.questionNumber}
                </button>
                <button
                  type="button"
                  onClick={() => onUserAnswerTap(row)}
                  style={{
                    padding: "4px 6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textAlign: "left",
                  }}
                >
                  {userToken}
                </button>
                <button
                  type="button"
                  onClick={() => onGabaritoTap(row.questionNumber)}
                  style={{
                    padding: "4px 6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textAlign: "left",
                  }}
                >
                  {gabToken}
                </button>
                <div
                  style={{
                    padding: "4px 6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: statusDot.bg,
                      flexShrink: 0,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteTap(row)}
                  style={{
                    padding: "4px 6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "0.6875rem",
                  }}
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => onToggleComment(row.questionNumber)}
                  style={{
                    padding: "4px 6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: hasComment
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "0.6875rem",
                  }}
                >
                  +
                </button>

                {isExpanded && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "0.5rem 0",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    <CitrusCommentTextarea
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
    </div>
  );
}
