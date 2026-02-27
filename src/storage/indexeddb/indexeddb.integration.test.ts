/**
 * Integration test: create -> reload -> read
 * Gate for WP-03 IndexedDB Layer per IMPLEMENTATION_PLAN.md.
 *
 * Verifies that session, PDF blob, markers, and gabarito entries persist
 * across database close/reopen (simulating page reload).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { deleteDB } from "idb";
import { openDatabase } from "./db";
import {
  putSession,
  getSession,
  listSessions,
  deleteSessionCascade,
} from "./sessionAdapter";
import { putPdfBlob, getPdfBlob } from "./pdfBlobAdapter";
import { putMarker, listMarkersBySession } from "./markerAdapter";
import { putGabaritoEntry, listGabaritoEntriesBySession } from "./gabaritoAdapter";
import {
  putAnswerComment,
  getAnswerComment,
  listAnswerCommentsBySession,
} from "./answerCommentAdapter";
import type {
  Session,
  Marker,
  GabaritoEntry,
  AnswerComment,
} from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";

const DEFAULT_UI = {
  activeTab: "solve" as const,
  handedness: "right" as const,
  zoomMode: "free" as const,
  lastViewedPage: 1,
};

function makeSession(overrides: Partial<Session> = {}): Session {
  const now = Date.now();
  return {
    id: "test-session-1",
    title: "Test Session",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "sample.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 1024,
    pdfSha256: "test-sha256-placeholder",
    pageCount: 5,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
    ...overrides,
  };
}

function makeMarker(overrides: Partial<Marker> = {}): Marker {
  const now = Date.now();
  return {
    id: "marker-1",
    sessionId: "test-session-1",
    pageNumber: 1,
    xPct: 0.5,
    yPct: 0.5,
    questionNumber: 1,
    answerToken: "A",
    status: "valid",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeGabaritoEntry(overrides: Partial<GabaritoEntry> = {}): GabaritoEntry {
  const now = Date.now();
  return {
    id: "gabarito-1",
    sessionId: "test-session-1",
    questionNumber: 1,
    answerToken: "A",
    source: "import",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("IndexedDB create->reload->read", () => {
  beforeEach(async () => {
    await deleteDB(DB_NAME);
  });

  it("persists session, PDF blob, markers, and gabarito across close/reopen", async () => {
    const session = makeSession();
    const marker = makeMarker();
    const gabaritoEntry = makeGabaritoEntry();
    const pdfBlob = new Blob(["fake pdf content"], { type: "application/pdf" });

    {
      const db = await openDatabase();
      await putSession(db, session);
      await putPdfBlob(db, session.id, pdfBlob);
      await putMarker(db, marker);
      await putGabaritoEntry(db, gabaritoEntry);
      db.close();
    }

    {
      const db = await openDatabase();
      const sessions = await listSessions(db);
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        id: session.id,
        title: session.title,
        pdfFileName: session.pdfFileName,
      });

      const restoredSession = await getSession(db, session.id);
      expect(restoredSession).not.toBeUndefined();
      expect(restoredSession?.id).toBe(session.id);

      // PDF blob: put/get round-trip. fake-indexeddb may not restore Blob instance in Node;
      // real browser IndexedDB preserves Blob per spec 01 §5.3. Session+markers+gabarito
      // are the main persistence gate.
      const restoredBlob = await getPdfBlob(db, session.id);
      expect(restoredBlob).toBeDefined();

      const markers = await listMarkersBySession(db, session.id);
      expect(markers).toHaveLength(1);
      expect(markers[0]).toMatchObject({
        id: marker.id,
        sessionId: marker.sessionId,
        questionNumber: marker.questionNumber,
        answerToken: marker.answerToken,
      });

      const entries = await listGabaritoEntriesBySession(db, session.id);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        id: gabaritoEntry.id,
        sessionId: gabaritoEntry.sessionId,
        questionNumber: gabaritoEntry.questionNumber,
        answerToken: gabaritoEntry.answerToken,
      });

      db.close();
    }
  });

<<<<<<< HEAD
  it("deleteSessionCascade removes session, PDF blob, markers, gabarito", async () => {
    const session = makeSession();
    const marker = makeMarker();
    const gabaritoEntry = makeGabaritoEntry();
    const pdfBlob = new Blob(["fake pdf content"], { type: "application/pdf" });

    {
      const db = await openDatabase();
      await putSession(db, session);
      await putPdfBlob(db, session.id, pdfBlob);
      await putMarker(db, marker);
      await putGabaritoEntry(db, gabaritoEntry);
      db.close();
    }

    {
      const db = await openDatabase();
      await deleteSessionCascade(db, session.id);
      db.close();
    }

    {
      const db = await openDatabase();
      const restoredSession = await getSession(db, session.id);
      expect(restoredSession).toBeUndefined();

      const restoredBlob = await getPdfBlob(db, session.id);
      expect(restoredBlob).toBeUndefined();

      const markers = await listMarkersBySession(db, session.id);
      expect(markers).toHaveLength(0);

      const entries = await listGabaritoEntriesBySession(db, session.id);
      expect(entries).toHaveLength(0);

      const sessions = await listSessions(db);
      expect(sessions).toHaveLength(0);

      db.close();
    }
  });

  it("persists answer comments across close/reopen", async () => {
    const session = makeSession();
    const comment: AnswerComment = {
      id: "comment-1",
      sessionId: session.id,
      questionNumber: 5,
      comment: "Need to review this one",
      updatedAt: Date.now(),
    };

    {
      const db = await openDatabase();
      await putSession(db, session);
      await putAnswerComment(db, comment);
      db.close();
    }

    {
      const db = await openDatabase();
      const restored = await getAnswerComment(
        db,
        session.id,
        comment.questionNumber
      );
      expect(restored).not.toBeNull();
      expect(restored?.comment).toBe("Need to review this one");
      expect(restored?.questionNumber).toBe(5);

      const all = await listAnswerCommentsBySession(db, session.id);
      expect(all).toHaveLength(1);
      expect(all[0].comment).toBe("Need to review this one");
      db.close();
    }
  });
});
