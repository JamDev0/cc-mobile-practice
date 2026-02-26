"use client";

import React, { useCallback, useState } from "react";
import { useReviewSession } from "../hooks/useReviewSession";
import { EditGabaritoModal } from "./EditGabaritoModal";
import { ImportGabaritoModal } from "./ImportGabaritoModal";
import type { JumpRequest } from "@/features/solve/types";
import type { Marker, ReviewRow, RowStatus } from "@/domain/models/types";

const ROW_STATUS_LABELS: Record<RowStatus, string> = {
  correct: "✓",
  wrong: "✗",
  blank: "—",
  conflict: "!",
  not_gradable: "?",
};

function StatusBadge({ status }: { status: RowStatus }) {
  const label = ROW_STATUS_LABELS[status];
  const colors: Record<RowStatus, { bg: string; fg: string }> = {
    correct: { bg: "#d1fae5", fg: "#065f46" },
    wrong: { bg: "#fee2e2", fg: "#991b1b" },
    blank: { bg: "#f3f4f6", fg: "#374151" },
    conflict: { bg: "#fef3c7", fg: "#92400e" },
    not_gradable: { bg: "#e5e7eb", fg: "#6b7280" },
  };
  const { bg, fg } = colors[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        padding: "0.125rem 0.375rem",
        borderRadius: 4,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: bg,
        color: fg,
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
        background: "rgba(0,0,0,0.5)",
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
          background: "white",
          borderRadius: 12,
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>
          Question {questionNumber} has multiple markers
        </h3>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#6b7280" }}>
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
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
                fontSize: "0.9375rem",
              }}
            >
              Marker on page {m.pageNumber} — {m.answerToken ?? "—"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "white",
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
    getGabaritoEntryByQuestion,
    saveGabaritoEntry,
    deleteGabaritoEntry,
    importGabarito,
    detectImportFormat,
  } = useReviewSession(sessionId);

  const [showImportModal, setShowImportModal] = useState(false);
  const [editGabaritoRow, setEditGabaritoRow] = useState<{
    questionNumber: number;
  } | null>(null);
  const [conflictRow, setConflictRow] = useState<{
    row: ReviewRow;
    openEditAfterJump: boolean;
  } | null>(null);

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

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>Loading review...</p>
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
      : "—";

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
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid #e5e7eb",
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
            padding: "0.375rem 0.75rem",
            borderRadius: 6,
            border: "1px solid #2563eb",
            background: "white",
            color: "#2563eb",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Import gabarito
        </button>
        <span style={{ fontWeight: 600 }}>Score: {accuracyLabel}</span>
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          {snapshot.correctCount} correct · {snapshot.wrongCount} wrong
          {snapshot.blankCount > 0 && ` · ${snapshot.blankCount} blank`}
        </span>
        {snapshot.conflictExcludedCount > 0 && (
          <span style={{ fontSize: "0.875rem", color: "#92400e" }}>
            {snapshot.conflictExcludedCount} conflict
          </span>
        )}
        {snapshot.notGradableCount > 0 && (
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {snapshot.notGradableCount} not gradable
          </span>
        )}
      </div>

      {(missingUserCount > 0 || missingGabaritoCount > 0) && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "0.8125rem",
            color: "#6b7280",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
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
            fontSize: "0.9375rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                You
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Key
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row) => (
              <tr
                key={row.questionNumber}
                style={{ borderBottom: "1px solid #f3f4f6" }}
              >
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    minWidth: 48,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleQuestionNumberTap(row)}
                    disabled={row.userMarkers.length === 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: row.userMarkers.length > 0 ? "pointer" : "default",
                      padding: 0,
                      fontWeight: 600,
                      color: row.userMarkers.length > 0 ? "#2563eb" : "#9ca3af",
                      fontSize: "inherit",
                    }}
                  >
                    {row.questionNumber}
                  </button>
                </td>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    minWidth: 48,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleUserAnswerTap(row)}
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
                    }}
                  >
                    {row.effectiveUserToken ?? "—"}
                  </button>
                </td>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    minWidth: 48,
                  }}
                >
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
                    }}
                  >
                    {row.gabaritoToken ?? "—"}
                  </button>
                </td>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "center",
                  }}
                >
                  <StatusBadge status={row.status} />
                </td>
              </tr>
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
    </div>
  );
}
