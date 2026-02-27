"use client";

import { useState } from "react";
import { ANSWER_TOKENS } from "@/domain/models/constants";
import type { AnswerToken, Marker } from "@/domain/models/types";

interface EditMarkerSheetProps {
  marker: Marker;
  existingQuestionNumbers: Set<number>;
  onSave: (patch: {
    questionNumber?: number;
    answerToken?: AnswerToken;
  }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditMarkerSheet({
  marker,
  existingQuestionNumbers,
  onSave,
  onDelete,
  onClose,
}: EditMarkerSheetProps) {
  const [questionNumber, setQuestionNumber] = useState(marker.questionNumber.toString());
  const [answerToken, setAnswerToken] = useState<AnswerToken>(
    marker.answerToken ?? "A"
  );
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<{
    questionNumber?: number;
    answerToken?: AnswerToken;
  } | null>(null);

  const qNum = parseInt(questionNumber, 10);
  const isValidQuestion =
    !Number.isNaN(qNum) && Number.isInteger(qNum) && qNum >= 1;
  const isDuplicate =
    isValidQuestion &&
    qNum !== marker.questionNumber &&
    existingQuestionNumbers.has(qNum);

  const handleSaveClick = () => {
    if (!isValidQuestion) return;
    if (isDuplicate) {
      setPendingPatch({ questionNumber: qNum, answerToken });
      setShowDuplicateWarning(true);
      return;
    }
    onSave({
      questionNumber: qNum,
      answerToken,
    });
    onClose();
  };

  const handleDuplicateContinue = () => {
    if (pendingPatch) {
      onSave(pendingPatch);
      setPendingPatch(null);
    }
    setShowDuplicateWarning(false);
    onClose();
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateWarning(false);
    setPendingPatch(null);
  };

  if (showDuplicateWarning) {
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
      >
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-modal)",
            padding: "1.5rem",
            maxWidth: 320,
            border: `1px solid var(--color-border)`,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1rem",
              fontWeight: "var(--font-weight-heading)",
              color: "var(--color-text)",
            }}
          >
            Question number already used
          </h3>
          <p
            style={{
              margin: "0 0 1rem 0",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Saving this change creates a conflict and excludes this question from
            grading.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleDuplicateCancel}
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
              onClick={handleDuplicateContinue}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-danger)",
                color: "white",
                border: "none",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--color-surface)",
        borderTopLeftRadius: "var(--radius-sheet)",
        borderTopRightRadius: "var(--radius-sheet)",
        padding: "1.25rem",
        paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        boxShadow: "var(--shadow-sheet)",
        zIndex: 1000,
        borderTop: `1px solid var(--color-border)`,
      }}
    >
      <h3
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1rem",
          fontWeight: "var(--font-weight-heading)",
          letterSpacing: "var(--letter-spacing-heading)",
          color: "var(--color-text)",
        }}
      >
        Edit marker
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label
            htmlFor="edit-question-number"
            style={{
              display: "block",
              marginBottom: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Question number
          </label>
          <input
            id="edit-question-number"
            type="number"
            min={1}
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value.replace(/[^0-9]/g, ""))}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-input-border)`,
              background: "var(--color-input-bg)",
              color: "var(--color-input-text)",
              fontSize: "1rem",
              fontFamily: "var(--font-family-mono)",
            }}
          />
          {isDuplicate && (
            <p
              style={{
                margin: "0.375rem 0 0",
                fontSize: "0.75rem",
                color: "var(--color-danger)",
              }}
            >
              Question number already used
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="edit-answer-token"
            style={{
              display: "block",
              marginBottom: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Answer
          </label>
          <select
            id="edit-answer-token"
            value={answerToken}
            onChange={(e) => setAnswerToken(e.target.value as AnswerToken)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-input-border)`,
              background: "var(--color-input-bg)",
              color: "var(--color-input-text)",
              fontSize: "1rem",
            }}
          >
            {ANSWER_TOKENS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "1.25rem",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger)",
            color: "white",
            border: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Delete
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!isValidQuestion}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              background: isValidQuestion ? "var(--color-accent)" : "var(--color-text-muted)",
              color: "var(--color-accent-text)",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isValidQuestion ? "pointer" : "not-allowed",
              minHeight: 44,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
