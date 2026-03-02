"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useReviewSession } from "../hooks/useReviewSession";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import { EditGabaritoModal } from "./EditGabaritoModal";
import { ImportGabaritoModal } from "./ImportGabaritoModal";
import { TerraReviewDisplay } from "@/variants/terra";
import type { JumpRequest } from "@/features/solve/types";
import type { Marker, ReviewRow } from "@/domain/models/types";

function ConflictPickerModal({
  markers,
  questionNumber,
  onSelect,
  onClose,
  openEditAfterJump,
}: {
  markers: Marker[];
  questionNumber: number;
  onSelect: (marker: Marker, openEdit: boolean) => void;
  onClose: () => void;
  openEditAfterJump: boolean;
}) {
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
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Choose which marker to open:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onSelect(m, openEditAfterJump); onClose(); }}
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
              Marker on page {m.pageNumber} {"\u2014"} {m.answerToken ?? "\u2014"}
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

function DeleteConflictPickerModal({
  markers,
  questionNumber,
  onSelect,
  onClose,
}: {
  markers: Marker[];
  questionNumber: number;
  onSelect: (marker: Marker) => void;
  onClose: () => void;
}) {
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
        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", fontWeight: "var(--font-weight-heading)", color: "var(--color-text)" }}>
          Question {questionNumber} has multiple markers
        </h3>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Choose which marker to delete:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onSelect(m); onClose(); }}
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
              Marker on page {m.pageNumber} {"\u2014"} {m.answerToken ?? "\u2014"}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} style={{ marginTop: "1rem", padding: "0.5rem 1rem", border: `1px solid var(--color-border)`, borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ questionNumber, onConfirm, onCancel }: { questionNumber: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--color-modal-backdrop)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} role="dialog" aria-label="Delete user answer confirmation">
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-modal)", padding: "1.5rem", maxWidth: 320, width: "100%", border: `1px solid var(--color-border)`, boxShadow: "var(--shadow-lg)" }}>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: "var(--font-weight-heading)", color: "var(--color-text)" }}>Delete this user answer?</p>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>Question {questionNumber} will show as missing user answer.</p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ padding: "0.5rem 1rem", border: `1px solid var(--color-border)`, borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "var(--radius-md)", background: "var(--color-danger)", color: "white", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
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
  const [editGabaritoRow, setEditGabaritoRow] = useState<{ questionNumber: number } | null>(null);
  const [conflictRow, setConflictRow] = useState<{ row: ReviewRow; openEditAfterJump: boolean } | null>(null);
  const [deleteConflictRow, setDeleteConflictRow] = useState<ReviewRow | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ markerId: string; questionNumber: number } | null>(null);
  const [expandedCommentRow, setExpandedCommentRow] = useState<number | null>(null);

  useEffect(() => {
    if (session && snapshot && !sessionNotFound) {
      markViewInteractive("review");
    }
  }, [session, snapshot, sessionNotFound]);

  const handleQuestionNumberTap = useCallback((row: ReviewRow) => {
    if (row.userMarkers.length === 0) return;
    if (row.userMarkers.length > 1) { setConflictRow({ row, openEditAfterJump: false }); return; }
    const marker = row.userMarkers[0];
    onRequestJump({ sessionId, markerId: marker.id, pageNumber: marker.pageNumber });
  }, [sessionId, onRequestJump]);

  const handleUserAnswerTap = useCallback((row: ReviewRow) => {
    if (row.userMarkers.length === 0) return;
    if (row.userMarkers.length > 1) { setConflictRow({ row, openEditAfterJump: true }); return; }
    const marker = row.userMarkers[0];
    onRequestJump({ sessionId, markerId: marker.id, pageNumber: marker.pageNumber, openEditMarkerId: marker.id });
  }, [sessionId, onRequestJump]);

  const handleConflictSelect = useCallback((marker: Marker, openEditAfterJump: boolean) => {
    setConflictRow(null);
    onRequestJump({ sessionId, markerId: marker.id, pageNumber: marker.pageNumber, ...(openEditAfterJump && { openEditMarkerId: marker.id }) });
  }, [sessionId, onRequestJump]);

  const handleDeleteTap = useCallback((row: ReviewRow) => {
    if (row.userMarkers.length === 0) return;
    if (row.userMarkers.length > 1) { setDeleteConflictRow(row); return; }
    setDeleteConfirmTarget({ markerId: row.userMarkers[0].id, questionNumber: row.questionNumber });
  }, []);

  const handleDeleteConflictSelect = useCallback((marker: Marker) => {
    setDeleteConflictRow(null);
    setDeleteConfirmTarget({ markerId: marker.id, questionNumber: marker.questionNumber });
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
        <Link href="/sessions" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>Back to Sessions</Link>
      </div>
    );
  }

  if (sessionNotFound) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>Session not found.</p>
        <Link href="/sessions" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>Back to Sessions</Link>
      </div>
    );
  }

  if (!session || !snapshot) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</div>;
  }

  const displayProps = {
    snapshot,
    onQuestionNumberTap: handleQuestionNumberTap,
    onUserAnswerTap: handleUserAnswerTap,
    onGabaritoTap: (qn: number) => setEditGabaritoRow({ questionNumber: qn }),
    onDeleteTap: handleDeleteTap,
    onImportClick: () => setShowImportModal(true),
    getCommentByQuestion,
    expandedCommentRow,
    onToggleComment: (qn: number) => setExpandedCommentRow(prev => prev === qn ? null : qn),
    onSaveComment: saveAnswerComment,
    writeError,
    clearWriteError,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "auto" }}>
      <TerraReviewDisplay {...displayProps} />

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
          onSelect={handleConflictSelect}
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
