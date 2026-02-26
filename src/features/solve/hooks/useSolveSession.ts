"use client";

import { useCallback, useEffect, useState } from "react";
import { openDatabase } from "@/storage/indexeddb/db";
import { getSession } from "@/storage/indexeddb/sessionAdapter";
import { getPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import {
  listMarkersBySession,
  putMarker,
  deleteMarker,
} from "@/storage/indexeddb/markerAdapter";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { deriveMarkerStatuses } from "@/domain/conflicts/deriveMarkerStatuses";
import {
  validateMarkerQuestionNumber,
  normalizeCoordinates,
} from "@/domain/models/invariants";
import { isValidAnswerToken } from "@/domain/models/invariants";
import type { Session, Marker, AnswerToken } from "@/domain/models/types";
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
  setHighlightedMarkerId: (id: string | null) => void;
  existingQuestionNumbers: Set<number>;
  pendingAnchor: { x: number; y: number } | null;
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
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const db = await openDatabase();
      const s = await getSession(db, sessionId);
      const blob = await getPdfBlob(db, sessionId);
      const m = await listMarkersBySession(db, sessionId);
      db.close();
      setSession(s ?? null);
      setPdfBlob(blob ?? null);
      setMarkers(deriveMarkerStatuses(m));
      setPageCountState(s?.pageCount ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
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
    } catch {
      // non-blocking
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
      } catch {
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
        setEditMarker(updated);
      } catch {
        // handle error
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
    } catch {
      // handle error
    }
  }, [editMarker, sessionId]);

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
    setPageCount,
    setActivePage,
    createPendingMarker,
    commitMarker,
    cancelPendingMarker,
    openEditMarker,
    closeEditMarker,
    saveEditMarker,
    deleteEditMarker,
    setHighlightedMarkerId,
    existingQuestionNumbers,
    pendingAnchor,
  };
}
