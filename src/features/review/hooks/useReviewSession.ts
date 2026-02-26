"use client";

import { useCallback, useEffect, useState } from "react";
import { openDatabase } from "@/storage/indexeddb/db";
import { getSession } from "@/storage/indexeddb/sessionAdapter";
import { listMarkersBySession } from "@/storage/indexeddb/markerAdapter";
import {
  listGabaritoEntriesBySession,
  putGabaritoEntry,
  deleteGabaritoEntry,
  deleteAllGabaritoEntriesForSession,
} from "@/storage/indexeddb/gabaritoAdapter";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
import { computeGradingSnapshot } from "@/domain/grading/computeGradingSnapshot";
import {
  parseGabarito,
  detectFormat,
  normalizeInput,
  type ImportFormat,
} from "@/domain/import/parser";
import { isValidAnswerToken } from "@/domain/models/invariants";
import { validateGabaritoQuestionNumber } from "@/domain/models/invariants";
import type {
  AnswerToken,
  GabaritoEntry,
  GradingSnapshot,
  ImportReport,
  Marker,
  Session,
} from "@/domain/models/types";

function generateGabaritoId(): string {
  return `gabarito-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ImportStrategy = "replace" | "merge";

export interface ImportGabaritoOptions {
  format: ImportFormat;
  strategy: ImportStrategy;
  startQuestionNumber?: number;
}

export interface UseReviewSessionResult {
  session: Session | null;
  markers: Marker[];
  gabaritoEntries: GabaritoEntry[];
  snapshot: GradingSnapshot | null;
  error: string | null;
  /** Non-blocking error from failed DB writes (e.g. save gabarito, import). */
  writeError: string | null;
  /** True when load completed but session does not exist. */
  sessionNotFound: boolean;
  refresh: () => Promise<void>;
  saveGabaritoEntry: (
    questionNumber: number,
    answerToken: AnswerToken
  ) => Promise<void>;
  deleteGabaritoEntry: (entryId: string) => Promise<void>;
  getGabaritoEntryByQuestion: (questionNumber: number) => GabaritoEntry | null;
  importGabarito: (
    rawText: string,
    options: ImportGabaritoOptions
  ) => Promise<ImportReport | null>;
  detectImportFormat: (rawText: string) => ReturnType<typeof detectFormat>;
  clearWriteError: () => void;
}

export function useReviewSession(
  sessionId: string | null
): UseReviewSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [gabaritoEntries, setGabaritoEntries] = useState<GabaritoEntry[]>([]);
  const [snapshot, setSnapshot] = useState<GradingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [sessionNotFound, setSessionNotFound] = useState(false);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setSessionNotFound(false);
    setError(null);
    setWriteError(null);
    try {
      const db = await openDatabase();
      const s = await getSession(db, sessionId);
      const m = await listMarkersBySession(db, sessionId);
      const g = await listGabaritoEntriesBySession(db, sessionId);
      db.close();
      setSession(s ?? null);
      setMarkers(deriveMarkerStatuses(m));
      setGabaritoEntries(g);
      setSnapshot(
        computeGradingSnapshot(sessionId, deriveMarkerStatuses(m), g)
      );
      setSessionNotFound(s == null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setSessionNotFound(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const saveGabaritoEntry = useCallback(
    async (questionNumber: number, answerToken: AnswerToken) => {
      if (!sessionId || !isValidAnswerToken(answerToken)) return;
      if (!validateGabaritoQuestionNumber(questionNumber)) return;

      const existing = gabaritoEntries.find(
        (e) => e.questionNumber === questionNumber
      );
      const now = Date.now();
      const entry: GabaritoEntry = existing
        ? {
            ...existing,
            answerToken,
            updatedAt: now,
          }
        : {
            id: generateGabaritoId(),
            sessionId,
            questionNumber,
            answerToken,
            source: "manual",
            createdAt: now,
            updatedAt: now,
          };

      try {
        const db = await openDatabase();
        await putGabaritoEntry(db, entry);
        const all = await listGabaritoEntriesBySession(db, sessionId);
        db.close();
        setGabaritoEntries(all);
        setSnapshot(
          computeGradingSnapshot(sessionId, markers, all)
        );
        setWriteError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save gabarito";
        setWriteError(msg);
      }
    },
    [sessionId, gabaritoEntries, markers]
  );

  const deleteGabaritoEntryById = useCallback(
    async (entryId: string) => {
      if (!sessionId) return;
      try {
        const db = await openDatabase();
        await deleteGabaritoEntry(db, entryId);
        const all = await listGabaritoEntriesBySession(db, sessionId);
        db.close();
        setGabaritoEntries(all);
        setSnapshot(
          computeGradingSnapshot(sessionId, markers, all)
        );
        setWriteError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete gabarito";
        setWriteError(msg);
      }
    },
    [sessionId, markers]
  );

  const getGabaritoEntryByQuestion = useCallback(
    (questionNumber: number) =>
      gabaritoEntries.find((e) => e.questionNumber === questionNumber) ?? null,
    [gabaritoEntries]
  );

  const detectImportFormatForText = useCallback((rawText: string) => {
    const { normalized } = normalizeInput(rawText);
    return detectFormat(normalized);
  }, []);

  const importGabaritoFn = useCallback(
    async (rawText: string, options: ImportGabaritoOptions) => {
      if (!sessionId) return null;
      const trimmed = rawText.trim();
      if (!trimmed) return null;

      const startQ = options.format === "B" ? options.startQuestionNumber ?? 1 : undefined;
      const { entries, report } = parseGabarito(trimmed, {
        format: options.format,
        startQuestionNumber: startQ,
      });
      if (entries.length === 0) return report;

      try {
        const db = await openDatabase();
        let existing: GabaritoEntry[] = [];
        if (options.strategy === "replace") {
          await deleteAllGabaritoEntriesForSession(db, sessionId);
        } else {
          existing = await listGabaritoEntriesBySession(db, sessionId);
        }
        const now = Date.now();
        const byQuestion = new Map(existing.map((g) => [g.questionNumber, g]));
        for (const e of entries) {
          const prev = options.strategy === "merge" ? byQuestion.get(e.questionNumber) : undefined;
          const entry: GabaritoEntry = prev
            ? {
                ...prev,
                answerToken: e.answerToken,
                source: "import",
                updatedAt: now,
              }
            : {
                id: generateGabaritoId(),
                sessionId,
                questionNumber: e.questionNumber,
                answerToken: e.answerToken,
                source: "import",
                createdAt: now,
                updatedAt: now,
              };
          await putGabaritoEntry(db, entry);
          if (options.strategy === "merge") byQuestion.set(e.questionNumber, entry);
        }
        const all = await listGabaritoEntriesBySession(db, sessionId);
        db.close();
        setGabaritoEntries(all);
        setSnapshot(computeGradingSnapshot(sessionId, markers, all));
        setWriteError(null);
        return report;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to import gabarito";
        setWriteError(msg);
        return null;
      }
    },
    [sessionId, markers]
  );

  return {
    session,
    markers,
    gabaritoEntries,
    snapshot,
    error,
    writeError,
    sessionNotFound,
    refresh,
    saveGabaritoEntry,
    deleteGabaritoEntry: deleteGabaritoEntryById,
    getGabaritoEntryByQuestion,
    importGabarito: importGabaritoFn,
    detectImportFormat: detectImportFormatForText,
    clearWriteError,
  };
}
