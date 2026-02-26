/**
 * Marker CRUD adapter for IndexedDB.
 * Per specs/01-domain-data-model-ralph-spec.md §5.2.
 */

import type { Marker } from "@/domain/models/types";
import type { DbInstance } from "./db";

export async function putMarker(db: DbInstance, marker: Marker) {
  await db.put("markers", marker);
}

export async function getMarker(db: DbInstance, markerId: string) {
  return db.get("markers", markerId);
}

export async function listMarkersBySession(db: DbInstance, sessionId: string) {
  return db.getAllFromIndex("markers", "sessionId", sessionId);
}

export async function deleteMarker(db: DbInstance, markerId: string) {
  await db.delete("markers", markerId);
}
