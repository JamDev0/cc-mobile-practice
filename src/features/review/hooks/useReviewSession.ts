"use client";

import { useCallback, useEffect, useState } from "react";
import { openDatabase } from "@/storage/indexeddb/db";
import { getSession } from "@/storage/indexeddb/sessionAdapter";
import {
  listMarkersBySession,
} from "@/storage/indexeddb/markerAdapter";
import {
  listGabaritoEntriesBySession,
  putGabaritoEntry,
  deleteGabaritoEntry,
} from "@/storage/indexeddb/gabaritoAdapter";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
import { computeGradingSnapshot } from "@/domain/grading/computeGradingSnapshot";
import { isValidAnswerToken } from "@/domain/models/invariants";
import { validateGabaritoQuestionNumber } from "@/domain/models/invariants";
import type {
  AnswerToken,
  GabaritoEntry,
  GradingSnapshot,
  Marker,
  Session,
} from "@/domain/models/types";

function generateGabaritoId(): string {
  return `gabarito-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseReviewSessionResult {
  session: Session | null;
  markers: Marker[];
  gabaritoEntries: GabaritoEntry[];
  snapshot: GradingSnapshot | null;
  error: string | null;
  refresh: () => Promise<void>;
  saveGabaritoEntry: (
    questionNumber: number,
    answerToken: AnswerToken
  ) => Promise<void>;
  deleteGabaritoEntry: (entryId: string) => Promise<void>;
  getGabaritoEntryByQuestion: (questionNumber: number) => GabaritoEntry | null;
}

export function useReviewSession(
  sessionId: string | null
): UseReviewSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [gabaritoEntries, setGabaritoEntries] = useState<GabaritoEntry[]>([]);
  const [snapshot, setSnapshot] = useState<GradingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
      } catch {
        // non-blocking
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
      } catch {
        // non-blocking
      }
    },
    [sessionId, markers]
  );

  const getGabaritoEntryByQuestion = useCallback(
    (questionNumber: number) =>
      gabaritoEntries.find((e) => e.questionNumber === questionNumber) ?? null,
    [gabaritoEntries]
  );

  return {
    session,
    markers,
    gabaritoEntries,
    snapshot,
    error,
    refresh,
    saveGabaritoEntry,
    deleteGabaritoEntry: deleteGabaritoEntryById,
    getGabaritoEntryByQuestion,
  };
}
