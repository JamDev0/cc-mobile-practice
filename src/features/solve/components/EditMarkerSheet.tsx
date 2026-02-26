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
          background: "rgba(0,0,0,0.5)",
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 8,
            padding: "1.5rem",
            maxWidth: 320,
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            Question number already used
          </h3>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#374151" }}>
            Saving this change creates a conflict and excludes this question from
            grading.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleDuplicateCancel}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                background: "white",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDuplicateContinue}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 4,
                background: "#dc2626",
                color: "white",
                border: "none",
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
        background: "white",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: "1rem",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>
        Edit marker
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label
            htmlFor="edit-question-number"
            style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
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
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />
          {isDuplicate && (
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#dc2626" }}>
              Question number already used
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="edit-answer-token"
            style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
          >
            Answer
          </label>
          <select
            id="edit-answer-token"
            value={answerToken}
            onChange={(e) => setAnswerToken(e.target.value as AnswerToken)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #d1d5db",
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
          marginTop: "1rem",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={onDelete}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 4,
            background: "#dc2626",
            color: "white",
            border: "none",
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
              border: "1px solid #d1d5db",
              borderRadius: 4,
              background: "white",
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
              borderRadius: 4,
              background: "#2563eb",
              color: "white",
              border: "none",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
