/**
 * Session service per specs/04-nextjs-architecture-delivery-ralph-spec.md §10.
 * Creates and manages sessions.
 */

import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
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
