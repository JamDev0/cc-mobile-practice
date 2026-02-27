/**
 * Session CRUD adapter for IndexedDB.
 * Per specs/01-domain-data-model-ralph-spec.md §5 and spec 04 recommended APIs.
 */

import type { Session } from "@/domain/models/types";
import type { DbInstance } from "./db";

export async function putSession(db: DbInstance, session: Session) {
  await db.put("sessions", session);
}

export async function getSession(db: DbInstance, sessionId: string) {
  return db.get("sessions", sessionId);
}

export async function listSessions(db: DbInstance) {
  const sessions = await db.getAll("sessions");
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  return sessions;
}

export async function deleteSession(db: DbInstance, sessionId: string) {
  await db.delete("sessions", sessionId);
}

/**
 * Hard delete session and all associated data (PDF blob, markers, gabarito entries)
 * in a single transaction to avoid orphan data.
 */
export async function deleteSessionCascade(db: DbInstance, sessionId: string) {
  const tx = db.transaction(
    ["sessions", "pdfBlobs", "markers", "gabaritoEntries"],
    "readwrite"
  );
  const markersStore = tx.objectStore("markers");
  const markersIndex = markersStore.index("sessionId");
  const markerKeys = await markersIndex.getAllKeys(sessionId);
  for (const key of markerKeys) {
    await markersStore.delete(key);
  }
  const gabaritoStore = tx.objectStore("gabaritoEntries");
  const gabaritoIndex = gabaritoStore.index("sessionId");
  const gabaritoKeys = await gabaritoIndex.getAllKeys(sessionId);
  for (const key of gabaritoKeys) {
    await gabaritoStore.delete(key);
  }
  await tx.objectStore("pdfBlobs").delete(sessionId);
  await tx.objectStore("sessions").delete(sessionId);
  await tx.done;
}
