/**
 * Session service per specs/04-nextjs-architecture-delivery-ralph-spec.md §10.
 * Creates and manages sessions.
 */

import { openDatabase } from "@/storage/indexeddb/db";
import {
  putSession,
  getSession,
  listSessions as listSessionsFromDb,
} from "@/storage/indexeddb/sessionAdapter";
import { putPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import type { Session, SessionUiState } from "@/domain/models/types";

const DEFAULT_UI: SessionUiState = {
  activeTab: "solve",
  handedness: "right",
  zoomMode: "free",
  lastViewedPage: 1,
};

export type CreateSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export async function createSessionFromPdf(
  file: File,
  title?: string
): Promise<CreateSessionResult> {
  if (file.type !== "application/pdf") {
    return { ok: false, error: "File must be a PDF" };
  }

  const now = Date.now();
  const sessionId = `session-${now}-${Math.random().toString(36).slice(2, 9)}`;

  const session: Session = {
    id: sessionId,
    title: title ?? file.name.replace(/\.pdf$/i, "") ?? "Untitled",
    createdAt: now,
    updatedAt: now,
    pdfFileName: file.name,
    pdfMimeType: file.type,
    pdfByteLength: file.size,
    pdfSha256: "", // Placeholder; integrity check optional for V1
    pageCount: null, // Filled when PDF loads
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
  };

  try {
    const db = await openDatabase();
    await putSession(db, session);
    await putPdfBlob(db, sessionId, file);
    db.close();
    return { ok: true, sessionId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Failed to create session: ${message}` };
  }
}

export type ListSessionsResult =
  | { ok: true; sessions: Session[] }
  | { ok: false; error: string };

export async function listSessions(): Promise<ListSessionsResult> {
  try {
    const db = await openDatabase();
    const sessions = await listSessionsFromDb(db);
    db.close();
    return { ok: true, sessions };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Failed to list sessions: ${message}` };
  }
}

export type ReattachPdfResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Reattach PDF blob to existing session (E_PDF_BLOB_MISSING recovery).
 * Per specs/01-domain-data-model-ralph-spec.md §11.
 */
export async function reattachPdfBlob(
  sessionId: string,
  file: File
): Promise<ReattachPdfResult> {
  if (file.type !== "application/pdf") {
    return { ok: false, error: "File must be a PDF" };
  }

  try {
    const db = await openDatabase();
    const session = await getSession(db, sessionId);
    if (!session) {
      db.close();
      return { ok: false, error: "Session not found" };
    }
    await putPdfBlob(db, sessionId, file);
    const updated = {
      ...session,
      pdfFileName: file.name,
      pdfMimeType: file.type,
      pdfByteLength: file.size,
      updatedAt: Date.now(),
    };
    await putSession(db, updated);
    db.close();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Failed to reattach PDF: ${message}` };
  }
}
