/**
 * PDF blob storage adapter per specs/01-domain-data-model-ralph-spec.md §5.3.
 * Store PDF as Blob directly, keyed by sessionId.
 */

import type { DbInstance } from "./db";

export async function putPdfBlob(
  db: DbInstance,
  sessionId: string,
  blob: Blob
) {
  await db.put("pdfBlobs", { sessionId, blob });
}

export async function getPdfBlob(db: DbInstance, sessionId: string) {
  const record = await db.get("pdfBlobs", sessionId);
  return record?.blob;
}

export async function deletePdfBlob(db: DbInstance, sessionId: string) {
  await db.delete("pdfBlobs", sessionId);
}
