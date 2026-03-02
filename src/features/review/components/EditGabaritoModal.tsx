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
        background: "var(--color-modal-backdrop)",
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
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            color: "var(--color-text)",
          }}
        >
          {"Edit gabarito \u2014 Q"}{questionNumber}
        </h3>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="gabarito-token"
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
            id="gabarito-token"
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
                borderRadius: "var(--radius-md)",
                background: "var(--color-danger)",
                color: "white",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                minHeight: 40,
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
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              cursor: "pointer",
              minHeight: 40,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              background: "var(--color-accent)",
              color: "var(--color-accent-text)",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 40,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
