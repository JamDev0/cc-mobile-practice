/**
 * Gabarito entry CRUD adapter for IndexedDB.
 * Per specs/01-domain-data-model-ralph-spec.md §5.2.
 */

import type { GabaritoEntry } from "@/domain/models/types";
import type { DbInstance } from "./db";

export async function putGabaritoEntry(db: DbInstance, entry: GabaritoEntry) {
  await db.put("gabaritoEntries", entry);
}

export async function getGabaritoEntry(db: DbInstance, entryId: string) {
  return db.get("gabaritoEntries", entryId);
}

export async function listGabaritoEntriesBySession(
  db: DbInstance,
  sessionId: string
) {
  return db.getAllFromIndex("gabaritoEntries", "sessionId", sessionId);
}

export async function deleteGabaritoEntry(db: DbInstance, entryId: string) {
  await db.delete("gabaritoEntries", entryId);
}

/**
 * Delete all gabarito entries for a session. Used by Replace import strategy.
 */
export async function deleteAllGabaritoEntriesForSession(
  db: DbInstance,
  sessionId: string
) {
  const entries = await listGabaritoEntriesBySession(db, sessionId);
  const tx = db.transaction("gabaritoEntries", "readwrite");
  await Promise.all([
    ...entries.map((e) => tx.store.delete(e.id)),
    tx.done,
  ]);
}
