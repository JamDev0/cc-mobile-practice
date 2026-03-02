"use client";

import { useCallback, useEffect, useState } from "react";
import { openDatabase } from "@/storage/indexeddb/db";
import { getSession } from "@/storage/indexeddb/sessionAdapter";
import { getPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import { reattachPdfBlob } from "@/features/session/service/sessionService";
import {
  listMarkersBySession,
  putMarker,
  deleteMarker,
} from "@/storage/indexeddb/markerAdapter";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { listGabaritoEntriesBySession } from "@/storage/indexeddb/gabaritoAdapter";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
import {
  validateMarkerQuestionNumber,
  normalizeCoordinates,
} from "@/domain/models/invariants";
import { isValidAnswerToken } from "@/domain/models/invariants";
import type { Session, Marker, AnswerToken, GabaritoEntry } from "@/domain/models/types";
import type { PendingMarker } from "../types";

function generateId(): string {
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface UseSolveSessionResult {
  session: Session | null;
  pdfBlob: Blob | null;
  markers: Marker[];
  pageCount: number | null;
  pendingMarker: PendingMarker | null;
  editMarker: Marker | null;
  highlightedMarkerId: string | null;
  activePage: number;
  error: string | null;
  /** Non-blocking error from failed DB writes (e.g. save marker, update position). */
  writeError: string | null;
  /** True when load completed but session does not exist. */
  sessionNotFound: boolean;
  setPageCount: (n: number) => void;
  setActivePage: (n: number) => void;
  createPendingMarker: (pageNumber: number, xPct: number, yPct: number, anchorClientX: number, anchorClientY: number) => void;
  commitMarker: (token: AnswerToken, questionNumber?: number) => Promise<boolean>;
  cancelPendingMarker: () => void;
  openEditMarker: (marker: Marker) => void;
  closeEditMarker: () => void;
  saveEditMarker: (patch: {
    questionNumber?: number;
    answerToken?: AnswerToken;
  }) => Promise<void>;
  deleteEditMarker: () => Promise<void>;
  updateMarkerPosition: (markerId: string, pageNumber: number, xPct: number, yPct: number) => Promise<void>;
  setHighlightedMarkerId: (id: string | null) => void;
  existingQuestionNumbers: Set<number>;
  pendingAnchor: { x: number; y: number } | null;
  gabaritoByQuestion: Map<number, AnswerToken>;
  /** E_PDF_BLOB_MISSING recovery: reattach PDF to session when blob missing. */
  reattachPdf: (file: File) => Promise<{ ok: boolean; error?: string }>;
  clearWriteError: () => void;
}

export function useSolveSession(sessionId: string | null): UseSolveSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [pageCount, setPageCountState] = useState<number | null>(null);
  const [pendingMarker, setPendingMarker] = useState<PendingMarker | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<{ x: number; y: number } | null>(null);
  const [editMarker, setEditMarker] = useState<Marker | null>(null);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [gabaritoByQuestion, setGabaritoByQuestion] = useState<Map<number, AnswerToken>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [sessionNotFound, setSessionNotFound] = useState(false);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      if (!sessionId) return;
      setSessionNotFound(false);
      setError(null);
      setWriteError(null);
      try {
        const db = await openDatabase();
        if (signal.aborted) return;
        const s = await getSession(db, sessionId);
        const blob = await getPdfBlob(db, sessionId);
        const m = await listMarkersBySession(db, sessionId);
        const g = await listGabaritoEntriesBySession(db, sessionId);
        db.close();
        if (signal.aborted) return;
        setSession(s ?? null);
        setPdfBlob(blob ?? null);
        setMarkers(deriveMarkerStatuses(m));
        const gabMap = new Map<number, AnswerToken>();
        for (const entry of g) gabMap.set(entry.questionNumber, entry.answerToken);
        setGabaritoByQuestion(gabMap);
        setPageCountState(s?.pageCount ?? null);
        setSessionNotFound(s == null);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load");
        setSessionNotFound(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    const ac = new AbortController();
    loadData(ac.signal);
    return () => ac.abort();
  }, [loadData]);

  const setPageCount = useCallback(async (n: number) => {
    setPageCountState(n);
    if (!sessionId || !session) return;
    try {
      const db = await openDatabase();
      const updated = { ...session, pageCount: n, updatedAt: Date.now() };
      await putSession(db, updated);
      db.close();
      setSession(updated);
      setWriteError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save page count";
      setWriteError(msg);
    }
  }, [sessionId, session]);

  const existingQuestionNumbers = new Set(
    editMarker
      ? markers
          .filter((m) => m.id !== editMarker.id)
          .map((m) => m.questionNumber)
      : markers.map((m) => m.questionNumber)
  );

  const createPendingMarker = useCallback(
    (pageNumber: number, xPct: number, yPct: number, anchorClientX: number, anchorClientY: number) => {
      const suggested =
        (session?.lastInsertedQuestionNumber ?? 0) + 1;
      setPendingMarker({
        pageNumber,
        xPct,
        yPct,
        suggestedQuestionNumber: suggested,
        selectedToken: null,
      });
      setPendingAnchor({ x: anchorClientX, y: anchorClientY });
    },
    [session]
  );

  const commitMarker = useCallback(
    async (token: AnswerToken, questionNumber?: number): Promise<boolean> => {
      if (!sessionId || !session || !pendingMarker) return false;
      if (!isValidAnswerToken(token)) return false;

      const qNum = questionNumber ?? pendingMarker.suggestedQuestionNumber;
      if (!validateMarkerQuestionNumber(qNum)) return false;

      const { xPct, yPct } = normalizeCoordinates(pendingMarker.xPct, pendingMarker.yPct);
      const now = Date.now();
      const marker: Marker = {
        id: generateId(),
        sessionId,
        pageNumber: pendingMarker.pageNumber,
        xPct,
        yPct,
        questionNumber: qNum,
        answerToken: token,
        status: "valid",
        createdAt: now,
        updatedAt: now,
      };

      try {
        const db = await openDatabase();
        await putMarker(db, marker);
        const all = await listMarkersBySession(db, sessionId);
        const updatedSession = {
          ...session,
          lastInsertedQuestionNumber: qNum,
          updatedAt: now,
        };
        await putSession(db, updatedSession);
        db.close();
        setMarkers(deriveMarkerStatuses(all));
        setSession(updatedSession);
        setPendingMarker(null);
        setPendingAnchor(null);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save marker";
        setWriteError(msg);
        return false;
      }
    },
    [sessionId, session, pendingMarker]
  );

  const cancelPendingMarker = useCallback(() => {
    setPendingMarker(null);
    setPendingAnchor(null);
  }, []);

  const openEditMarker = useCallback((marker: Marker) => {
    setEditMarker(marker);
    setPendingMarker(null);
    setPendingAnchor(null);
  }, []);

  const closeEditMarker = useCallback(() => {
    setEditMarker(null);
    setHighlightedMarkerId(null);
  }, []);

  const saveEditMarker = useCallback(
    async (patch: {
      questionNumber?: number;
      answerToken?: AnswerToken;
    }) => {
      if (!editMarker || !sessionId) return;
      if (patch.answerToken && !isValidAnswerToken(patch.answerToken)) return;
      if (
        patch.questionNumber != null &&
        !validateMarkerQuestionNumber(patch.questionNumber)
      )
        return;

      const updated: Marker = {
        ...editMarker,
        ...(patch.questionNumber != null && {
          questionNumber: patch.questionNumber,
        }),
        ...(patch.answerToken != null && {
          answerToken: patch.answerToken,
        }),
        updatedAt: Date.now(),
      };

      try {
        const db = await openDatabase();
        await putMarker(db, updated);
        const all = await listMarkersBySession(db, sessionId);
        db.close();
        setMarkers(deriveMarkerStatuses(all));
        setEditMarker(null);
        setWriteError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save marker";
        setWriteError(msg);
      }
    },
    [editMarker, sessionId]
  );

  const deleteEditMarker = useCallback(async () => {
    if (!editMarker || !sessionId) return;
    try {
      const db = await openDatabase();
      await deleteMarker(db, editMarker.id);
      const all = await listMarkersBySession(db, sessionId);
      db.close();
      setMarkers(deriveMarkerStatuses(all));
      setEditMarker(null);
      setWriteError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete marker";
      setWriteError(msg);
    }
  }, [editMarker, sessionId]);

  const updateMarkerPosition = useCallback(
    async (markerId: string, pageNumber: number, xPct: number, yPct: number) => {
      if (!sessionId) return;
      const marker = markers.find((m) => m.id === markerId);
      if (!marker) return;

      const { xPct: nx, yPct: ny } = normalizeCoordinates(xPct, yPct);
      const updated: Marker = {
        ...marker,
        pageNumber,
        xPct: nx,
        yPct: ny,
        updatedAt: Date.now(),
      };

      try {
        const db = await openDatabase();
        await putMarker(db, updated);
        const all = await listMarkersBySession(db, sessionId);
        db.close();
        setMarkers(deriveMarkerStatuses(all));
        if (editMarker?.id === markerId) {
          setEditMarker(updated);
        }
        setWriteError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update marker position";
        setWriteError(msg);
      }
    },
    [sessionId, markers, editMarker]
  );

  const reattachPdf = useCallback(
    async (file: File): Promise<{ ok: boolean; error?: string }> => {
      if (!sessionId) return { ok: false, error: "No session" };
      const result = await reattachPdfBlob(sessionId, file);
      if (result.ok) {
        const db = await openDatabase();
        const s = await getSession(db, sessionId);
        const blob = await getPdfBlob(db, sessionId);
        db.close();
        setSession(s ?? null);
        setPdfBlob(blob ?? null);
      }
      return result.ok
        ? { ok: true }
        : { ok: false, error: result.error };
    },
    [sessionId]
  );

  return {
    session,
    pdfBlob,
    markers,
    pageCount,
    pendingMarker,
    editMarker,
    highlightedMarkerId,
    activePage,
    error,
    writeError,
    sessionNotFound,
    setPageCount,
    setActivePage,
    createPendingMarker,
    commitMarker,
    cancelPendingMarker,
    openEditMarker,
    closeEditMarker,
    saveEditMarker,
    deleteEditMarker,
    updateMarkerPosition,
    setHighlightedMarkerId,
    existingQuestionNumbers,
    pendingAnchor,
    gabaritoByQuestion,
    reattachPdf,
    clearWriteError,
  };
}
