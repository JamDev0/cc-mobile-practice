"use client";

import React, { useCallback, useState } from "react";
import { useAppHaptics } from "@/shared/hooks/useAppHaptics";
import type { ImportFormat } from "@/domain/import/parser";
import type { ImportReport, ImportWarning } from "@/domain/models/types";
import type { ImportStrategy } from "../hooks/useReviewSession";

interface ImportGabaritoModalProps {
  onImport: (
    rawText: string,
    options: {
      format: ImportFormat;
      strategy: ImportStrategy;
      startQuestionNumber?: number;
    }
  ) => Promise<ImportReport | null>;
  detectFormat: (rawText: string) => { mode: "A" } | { mode: "B" } | { mode: "ambiguous" };
  onClose: () => void;
}

export function ImportGabaritoModal({
  onImport,
  detectFormat: detectFormatFn,
  onClose,
}: ImportGabaritoModalProps) {
  const { success } = useAppHaptics();
  const [rawText, setRawText] = useState("");
  const [format, setFormat] = useState<ImportFormat>("A");
  const [startQuestionNumber, setStartQuestionNumber] = useState("1");
  const [strategy, setStrategy] = useState<ImportStrategy>("replace");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detected = rawText.trim() ? detectFormatFn(rawText) : null;
  const isFormatAmbiguous = detected?.mode === "ambiguous";

  const handleImport = useCallback(async () => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const effectiveFormat = isFormatAmbiguous ? format : (detected?.mode === "A" || detected?.mode === "B" ? detected.mode : format);
    const startNum = effectiveFormat === "B" ? parseInt(startQuestionNumber, 10) : undefined;

    if (effectiveFormat === "B" && (startNum === undefined || Number.isNaN(startNum) || startNum < 1)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onImport(trimmed, {
        format: effectiveFormat,
        strategy,
        ...(effectiveFormat === "B" ? { startQuestionNumber: startNum ?? 1 } : {}),
      });
      setReport(result ?? null);
      if (result && result.importedCount > 0) {
        success();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [rawText, format, startQuestionNumber, strategy, isFormatAmbiguous, detected, onImport, success]);

  const trimmed = rawText.trim();
  const canSubmit = trimmed.length > 0;
  const needsStartNumber = detected?.mode === "B" || format === "B";
  const formatBStartValid = !needsStartNumber || (() => {
    const n = parseInt(startQuestionNumber, 10);
    return !Number.isNaN(n) && n >= 1;
  })();

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
      aria-label="Import gabarito"
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-modal)",
          padding: "1.5rem",
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.125rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            color: "var(--color-text)",
          }}
        >
          Import gabarito
        </h3>
        <p
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          Paste answer key as plain text. Format A: <code
            style={{
              padding: "0.125rem 0.375rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface-alt)",
              fontFamily: "var(--font-family-mono)",
              fontSize: "0.8125rem",
            }}
          >1A,2B,3C</code>. Format B: <code
            style={{
              padding: "0.125rem 0.375rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface-alt)",
              fontFamily: "var(--font-family-mono)",
              fontSize: "0.8125rem",
            }}
          >A,B,C</code> (sequential).
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="import-text"
            style={{
              display: "block",
              marginBottom: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Paste text
          </label>
          <textarea
            id="import-text"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setReport(null);
            }}
            placeholder="1A,2B,3C or A,B,C,D"
            rows={4}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-input-border)`,
              background: "var(--color-input-bg)",
              color: "var(--color-input-text)",
              fontSize: "0.875rem",
              fontFamily: "var(--font-family-mono)",
              resize: "vertical",
            }}
          />
        </div>

        {isFormatAmbiguous && trimmed && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="import-format"
              style={{
                display: "block",
                marginBottom: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              {"Format (ambiguous \u2014 choose)"}
            </label>
            <select
              id="import-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ImportFormat)}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--color-input-border)`,
                background: "var(--color-input-bg)",
                color: "var(--color-input-text)",
              }}
            >
              <option value="A">Format A (1A, 2B, ...)</option>
              <option value="B">Format B (A, B, C, ...)</option>
            </select>
          </div>
        )}

        {(detected?.mode === "B" || format === "B") && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="import-start"
              style={{
                display: "block",
                marginBottom: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
              }}
            >
              Start question number (Format B)
            </label>
            <input
              id="import-start"
              type="number"
              min={1}
              value={startQuestionNumber}
              onChange={(e) => setStartQuestionNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--color-input-border)`,
                background: "var(--color-input-bg)",
                color: "var(--color-input-text)",
                fontFamily: "var(--font-family-mono)",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="import-strategy"
            style={{
              display: "block",
              marginBottom: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            Strategy
          </label>
          <select
            id="import-strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as ImportStrategy)}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: `1px solid var(--color-input-border)`,
              background: "var(--color-input-bg)",
              color: "var(--color-input-text)",
            }}
          >
            <option value="replace">{"Replace \u2014 remove existing, insert new"}</option>
            <option value="merge">{"Merge \u2014 update overlaps, keep others"}</option>
          </select>
        </div>

        {report && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem",
              background: "var(--color-surface-alt)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              border: `1px solid var(--color-border)`,
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", color: "var(--color-text)", fontFamily: "var(--font-family-mono)" }}>
              Imported: {report.importedCount} {"\u00B7"} Skipped: {report.skippedCount}
            </p>
            {report.skippedCount > 0 && report.warnings.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowWarnings(!showWarnings)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.8125rem",
                    color: "var(--color-accent)",
                    fontWeight: 500,
                  }}
                >
                  {showWarnings ? "Hide" : "Show"} warnings
                </button>
                {showWarnings && (
                  <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.25rem" }}>
                    {report.warnings.map((w: ImportWarning, i: number) => (
                      <li
                        key={i}
                        style={{
                          marginBottom: "0.25rem",
                          color: "var(--color-text-secondary)",
                          fontSize: "0.8125rem",
                        }}
                      >
                        #{w.index + 1}: &quot;{w.rawValue}&quot; {"\u2014"} {w.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
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
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canSubmit || !formatBStartValid || isSubmitting}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              background: canSubmit && formatBStartValid
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
              color: "var(--color-accent-text)",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: canSubmit && formatBStartValid ? "pointer" : "not-allowed",
              minHeight: 40,
            }}
          >
            {isSubmitting ? "Importing\u2026" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
