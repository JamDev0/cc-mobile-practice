"use client";

import React, { useState } from "react";
import { ANSWER_TOKENS } from "@/domain/models/constants";
import type { AnswerToken, GabaritoEntry } from "@/domain/models/types";

interface EditGabaritoModalProps {
  questionNumber: number;
  entry: GabaritoEntry | null;
  onSave: (questionNumber: number, token: AnswerToken) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
}

export function EditGabaritoModal({
  questionNumber,
  entry,
  onSave,
  onDelete,
  onClose,
}: EditGabaritoModalProps) {
  const [answerToken, setAnswerToken] = useState<AnswerToken>(
    entry?.answerToken ?? "A"
  );

  const handleSave = () => {
    onSave(questionNumber, answerToken);
    onClose();
  };

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
      aria-label="Edit gabarito"
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
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem" }}>
          Edit gabarito — Q{questionNumber}
        </h3>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="gabarito-token"
            style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
          >
            Answer
          </label>
          <select
            id="gabarito-token"
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
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {entry && (
            <button
              type="button"
              onClick={() => {
                onDelete(entry.id);
                onClose();
              }}
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
          )}
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
            onClick={handleSave}
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
