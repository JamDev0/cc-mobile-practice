"use client";

import React, { useCallback, useState } from "react";
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
    } finally {
      setIsSubmitting(false);
    }
  }, [rawText, format, startQuestionNumber, strategy, isFormatAmbiguous, detected, onImport]);

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
        background: "rgba(0,0,0,0.5)",
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
          background: "white",
          borderRadius: 12,
          padding: "1.5rem",
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem" }}>
          Import gabarito
        </h3>
        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", color: "#6b7280" }}>
          Paste answer key as plain text. Format A: <code>1A,2B,3C</code>. Format B: <code>A,B,C</code> (sequential).
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="import-text"
            style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
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
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              fontSize: "0.9375rem",
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />
        </div>

        {isFormatAmbiguous && trimmed && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="import-format"
              style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
            >
              Format (ambiguous — choose)
            </label>
            <select
              id="import-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as ImportFormat)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #d1d5db",
              }}
            >
              <option value="A">Format A (1A, 2B, …)</option>
              <option value="B">Format B (A, B, C, …)</option>
            </select>
          </div>
        )}

        {(detected?.mode === "B" || format === "B") && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="import-start"
              style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
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
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="import-strategy"
            style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}
          >
            Strategy
          </label>
          <select
            id="import-strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as ImportStrategy)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="replace">Replace — remove existing, insert new</option>
            <option value="merge">Merge — update overlaps, keep others</option>
          </select>
        </div>

        {report && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem",
              background: "#f9fafb",
              borderRadius: 8,
              fontSize: "0.875rem",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0" }}>
              Imported: {report.importedCount} · Skipped: {report.skippedCount}
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
                    color: "#2563eb",
                  }}
                >
                  {showWarnings ? "Hide" : "Show"} warnings
                </button>
                {showWarnings && (
                  <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.25rem" }}>
                    {report.warnings.map((w: ImportWarning, i: number) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>
                        #{w.index + 1}: &quot;{w.rawValue}&quot; — {w.reason}
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
              border: "1px solid #d1d5db",
              borderRadius: 4,
              background: "white",
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
              borderRadius: 4,
              background: canSubmit && formatBStartValid ? "#2563eb" : "#9ca3af",
              color: "white",
              border: "none",
            }}
          >
            {isSubmitting ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
