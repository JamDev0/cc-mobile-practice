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
