"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useReviewSession } from "../hooks/useReviewSession";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import { EditGabaritoModal } from "./EditGabaritoModal";
import { ImportGabaritoModal } from "./ImportGabaritoModal";
import type { JumpRequest } from "@/features/solve/types";
import type { Marker, ReviewRow, RowStatus } from "@/domain/models/types";

const ROW_STATUS_LABELS: Record<RowStatus, string> = {
  correct: "\u2713",
  wrong: "\u2717",
  blank: "\u2014",
  conflict: "!",
  not_gradable: "?",
};

const STATUS_VAR_MAP: Record<RowStatus, { bg: string; fg: string }> = {
  correct: { bg: "var(--color-status-correct-bg)", fg: "var(--color-status-correct-fg)" },
  wrong: { bg: "var(--color-status-wrong-bg)", fg: "var(--color-status-wrong-fg)" },
  blank: { bg: "var(--color-status-blank-bg)", fg: "var(--color-status-blank-fg)" },
  conflict: { bg: "var(--color-status-conflict-bg)", fg: "var(--color-status-conflict-fg)" },
  not_gradable: { bg: "var(--color-status-notgradable-bg)", fg: "var(--color-status-notgradable-fg)" },
};

interface CommentTextareaProps {
  questionNumber: number;
  initialValue: string;
  onSave: (questionNumber: number, comment: string) => Promise<void>;
  onBlur: () => void;
}

function CommentTextarea({
  questionNumber,
  initialValue,
  onSave,
  onBlur,
}: CommentTextareaProps) {
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
      rows={3}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0.625rem 0.75rem",
        border: `1px solid var(--color-input-border)`,
        borderRadius: "var(--radius-md)",
        background: "var(--color-input-bg)",
        color: "var(--color-input-text)",
        fontSize: "0.875rem",
        resize: "vertical",
        fontFamily: "inherit",
      }}
    />
  );
}

function StatusBadge({ status }: { status: RowStatus }) {
  const label = ROW_STATUS_LABELS[status];
  const vars = STATUS_VAR_MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        padding: "0.125rem 0.5rem",
        borderRadius: "var(--radius-sm)",
        fontSize: "0.75rem",
        fontWeight: 700,
        background: vars.bg,
        color: vars.fg,
        fontFamily: "var(--font-family-mono)",
      }}
      title={status}
    >
      {label}
    </span>
  );
}

interface ConflictPickerModalProps {
  markers: Marker[];
  questionNumber: number;
  onSelect: (marker: Marker, openEdit: boolean) => void;
  onClose: () => void;
  openEditAfterJump: boolean;
}

interface DeleteConflictPickerModalProps {
  markers: Marker[];
  questionNumber: number;
  onSelect: (marker: Marker) => void;
  onClose: () => void;
}

function DeleteConflictPickerModal({
  markers,
  questionNumber,
  onSelect,
  onClose,
}: DeleteConflictPickerModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-modal-backdrop)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-label="Conflict: choose marker to delete"
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-modal)",
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
          }}
        >
          Question {questionNumber} has multiple markers
        </h3>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Choose which marker to delete:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m);
                onClose();
              }}
              style={{
                padding: "0.75rem 1rem",
                textAlign: "left",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--color-border)`,
                background: "var(--color-surface-alt)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Marker on page {m.pageNumber} \u2014 {m.answerToken ?? "\u2014"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            border: `1px solid var(--color-border)`,
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  questionNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({
  questionNumber,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-modal-backdrop)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-label="Delete user answer confirmation"
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-modal)",
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <p
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1rem",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
          }}
        >
          Delete this user answer?
        </p>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          Question {questionNumber} will show as missing user answer.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictPickerModal({
  markers,
  questionNumber,
  onSelect,
  onClose,
  openEditAfterJump,
}: ConflictPickerModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-modal-backdrop)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-label="Conflict: choose marker"
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-modal)",
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1rem",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
          }}
        >
          Question {questionNumber} has multiple markers
        </h3>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Choose which marker to open:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m, openEditAfterJump);
                onClose();
              }}
              style={{
                padding: "0.75rem 1rem",
                textAlign: "left",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--color-border)`,
                background: "var(--color-surface-alt)",
                color: "var(--color-text)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Marker on page {m.pageNumber} \u2014 {m.answerToken ?? "\u2014"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            border: `1px solid var(--color-border)`,
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ReviewScreenProps {
  sessionId: string;
  onRequestJump: (req: JumpRequest) => void;
}

export function ReviewScreen({ sessionId, onRequestJump }: ReviewScreenProps) {
  const {
    session,
    snapshot,
    error,
    writeError,
    sessionNotFound,
    getGabaritoEntryByQuestion,
    getCommentByQuestion,
    saveAnswerComment,
    saveGabaritoEntry,
    deleteGabaritoEntry,
    deleteUserMarker,
    importGabarito,
    detectImportFormat,
    clearWriteError,
  } = useReviewSession(sessionId);

  const [showImportModal, setShowImportModal] = useState(false);
  const [editGabaritoRow, setEditGabaritoRow] = useState<{
    questionNumber: number;
  } | null>(null);
  const [conflictRow, setConflictRow] = useState<{
    row: ReviewRow;
    openEditAfterJump: boolean;
  } | null>(null);
  const [deleteConflictRow, setDeleteConflictRow] = useState<ReviewRow | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    markerId: string;
    questionNumber: number;
  } | null>(null);
  const [expandedCommentRow, setExpandedCommentRow] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (session && snapshot && !sessionNotFound) {
      markViewInteractive("review");
    }
  }, [session, snapshot, sessionNotFound]);

  const handleQuestionNumberTap = useCallback(
    (row: ReviewRow) => {
      if (row.userMarkers.length === 0) return;
      if (row.userMarkers.length > 1) {
        setConflictRow({ row, openEditAfterJump: false });
        return;
      }
      const marker = row.userMarkers[0];
      onRequestJump({
        sessionId,
        markerId: marker.id,
        pageNumber: marker.pageNumber,
      });
    },
    [sessionId, onRequestJump]
  );

  const handleUserAnswerTap = useCallback(
    (row: ReviewRow) => {
      if (row.userMarkers.length === 0) return;
      if (row.userMarkers.length > 1) {
        setConflictRow({ row, openEditAfterJump: true });
        return;
      }
      const marker = row.userMarkers[0];
      onRequestJump({
        sessionId,
        markerId: marker.id,
        pageNumber: marker.pageNumber,
        openEditMarkerId: marker.id,
      });
    },
    [sessionId, onRequestJump]
  );

  const handleConflictSelect = useCallback(
    (marker: Marker, openEditAfterJump: boolean) => {
      setConflictRow(null);
      onRequestJump({
        sessionId,
        markerId: marker.id,
        pageNumber: marker.pageNumber,
        ...(openEditAfterJump && { openEditMarkerId: marker.id }),
      });
    },
    [sessionId, onRequestJump]
  );

  const handleDeleteTap = useCallback((row: ReviewRow) => {
    if (row.userMarkers.length === 0) return;
    if (row.userMarkers.length > 1) {
      setDeleteConflictRow(row);
      return;
    }
    setDeleteConfirmTarget({
      markerId: row.userMarkers[0].id,
      questionNumber: row.questionNumber,
    });
  }, []);

  const handleDeleteConflictSelect = useCallback((marker: Marker) => {
    setDeleteConflictRow(null);
    setDeleteConfirmTarget({
      markerId: marker.id,
      questionNumber: marker.questionNumber,
    });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmTarget) return;
    await deleteUserMarker(deleteConfirmTarget.markerId);
    setDeleteConfirmTarget(null);
  }, [deleteConfirmTarget, deleteUserMarker]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmTarget(null);
    setDeleteConflictRow(null);
  }, []);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-danger)", marginBottom: "0.75rem" }}>{error}</p>
        <Link
          href="/sessions"
          style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (sessionNotFound) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
          Session not found.
        </p>
        <Link
          href="/sessions"
          style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading session...
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading review...
      </div>
    );
  }

  const missingUserCount = snapshot.rows.filter(
    (r) => r.userMarkers.length === 0
  ).length;
  const missingGabaritoCount = snapshot.rows.filter(
    (r) => r.gabaritoToken === null
  ).length;

  const accuracyLabel =
    snapshot.accuracy != null
      ? `${(snapshot.accuracy * 100).toFixed(0)}%`
      : "\u2014";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "auto",
      }}
    >
      {writeError && (
        <div
          role="alert"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-danger-soft)",
            color: "var(--color-danger)",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <span>{writeError}</span>
          <button
            type="button"
            onClick={clearWriteError}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              fontSize: "1rem",
              color: "inherit",
              lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <div
        style={{
          padding: "1rem",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-surface)",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "var(--radius-md)",
            border: `1px solid var(--color-accent)`,
            background: "var(--color-accent-soft)",
            color: "var(--color-accent)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 36,
          }}
        >
          Import gabarito
        </button>
        <span
          style={{
            fontWeight: "var(--font-weight-heading)",
            fontSize: "1.125rem",
            fontFamily: "var(--font-family-mono)",
            color: "var(--color-text)",
          }}
        >
          {accuracyLabel}
        </span>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          {snapshot.correctCount} correct · {snapshot.wrongCount} wrong
          {snapshot.blankCount > 0 && ` · ${snapshot.blankCount} blank`}
        </span>
        {snapshot.conflictExcludedCount > 0 && (
          <span style={{ fontSize: "0.8125rem", color: "var(--color-status-conflict-fg)" }}>
            {snapshot.conflictExcludedCount} conflict
          </span>
        )}
        {snapshot.notGradableCount > 0 && (
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {snapshot.notGradableCount} not gradable
          </span>
        )}
      </div>

      {(missingUserCount > 0 || missingGabaritoCount > 0) && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "var(--color-surface-alt)",
            borderBottom: `1px solid var(--color-border)`,
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            fontFamily: "var(--font-family-mono)",
          }}
        >
          {missingUserCount > 0 && (
            <span>Missing user answers: {missingUserCount}</span>
          )}
          {missingGabaritoCount > 0 && (
            <span>Missing gabarito answers: {missingGabaritoCount}</span>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "0.5rem 0",
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
            <tr style={{ borderBottom: `1px solid var(--color-border)` }}>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                You
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Key
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  width: 52,
                  textAlign: "center",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Del
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  width: 56,
                  textAlign: "center",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row) => (
              <React.Fragment key={row.questionNumber}>
              <tr style={{ borderBottom: `1px solid var(--color-border)` }}>
                <td style={{ padding: "0.75rem 1rem", minWidth: 48 }}>
                  <button
                    type="button"
                    onClick={() => handleQuestionNumberTap(row)}
                    disabled={row.userMarkers.length === 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: row.userMarkers.length > 0 ? "pointer" : "default",
                      padding: 0,
                      fontWeight: 700,
                      color: row.userMarkers.length > 0
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                      fontSize: "inherit",
                      fontFamily: "var(--font-family-mono)",
                    }}
                  >
                    {row.questionNumber}
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", minWidth: 48 }}>
                  <button
                    type="button"
                    onClick={() => handleUserAnswerTap(row)}
                    data-testid={`user-answer-Q${row.questionNumber}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      minWidth: 44,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "inherit",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-family-mono)",
                      fontWeight: 600,
                    }}
                  >
                    {row.effectiveUserToken ?? "\u2014"}
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", minWidth: 48 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setEditGabaritoRow({ questionNumber: row.questionNumber })
                    }
                    data-testid={`gabarito-Q${row.questionNumber}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      minWidth: 44,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "inherit",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-family-mono)",
                      fontWeight: 600,
                    }}
                  >
                    {row.gabaritoToken ?? "\u2014"}
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                  <StatusBadge status={row.status} />
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center", verticalAlign: "middle" }}>
                  {row.userMarkers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTap(row)}
                      aria-label={`Delete user answer for question ${row.questionNumber}`}
                      data-testid={`delete-Q${row.questionNumber}`}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        minWidth: 44,
                        minHeight: 44,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        color: "var(--color-danger)",
                        fontWeight: 600,
                      }}
                    >
                      Del
                    </button>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      \u2014
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center", verticalAlign: "middle" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCommentRow((prev) =>
                        prev === row.questionNumber ? null : row.questionNumber
                      )
                    }
                    aria-expanded={expandedCommentRow === row.questionNumber}
                    aria-label={
                      getCommentByQuestion(row.questionNumber)
                        ? `Edit comment for question ${row.questionNumber}`
                        : `Add comment for question ${row.questionNumber}`
                    }
                    data-testid={`comment-toggle-Q${row.questionNumber}`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      minWidth: 44,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      color: getCommentByQuestion(row.questionNumber)
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {getCommentByQuestion(row.questionNumber) ? "\u270E" : "+"}
                  </button>
                </td>
              </tr>
              {expandedCommentRow === row.questionNumber && (
                <tr
                  key={`comment-${row.questionNumber}`}
                  style={{ borderBottom: `1px solid var(--color-border)` }}
                >
                  <td
                    colSpan={6}
                    style={{
                      padding: "0 1rem 0.75rem 1rem",
                      background: "var(--color-surface-alt)",
                      verticalAlign: "top",
                    }}
                  >
                    <CommentTextarea
                      questionNumber={row.questionNumber}
                      initialValue={
                        getCommentByQuestion(row.questionNumber) ?? ""
                      }
                      onSave={saveAnswerComment}
                      onBlur={() => setExpandedCommentRow(null)}
                    />
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {editGabaritoRow && (
        <EditGabaritoModal
          questionNumber={editGabaritoRow.questionNumber}
          entry={getGabaritoEntryByQuestion(editGabaritoRow.questionNumber)}
          onSave={saveGabaritoEntry}
          onDelete={deleteGabaritoEntry}
          onClose={() => setEditGabaritoRow(null)}
        />
      )}

      {showImportModal && (
        <ImportGabaritoModal
          onImport={importGabarito}
          detectFormat={detectImportFormat}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {conflictRow && (
        <ConflictPickerModal
          markers={conflictRow.row.userMarkers}
          questionNumber={conflictRow.row.questionNumber}
          onSelect={(m, openEdit) => handleConflictSelect(m, openEdit)}
          onClose={() => setConflictRow(null)}
          openEditAfterJump={conflictRow.openEditAfterJump}
        />
      )}

      {deleteConflictRow && (
        <DeleteConflictPickerModal
          markers={deleteConflictRow.userMarkers}
          questionNumber={deleteConflictRow.questionNumber}
          onSelect={handleDeleteConflictSelect}
          onClose={() => setDeleteConflictRow(null)}
        />
      )}

      {deleteConfirmTarget && (
        <DeleteConfirmModal
          questionNumber={deleteConfirmTarget.questionNumber}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
