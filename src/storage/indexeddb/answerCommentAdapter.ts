/**
 * Answer comment CRUD adapter for IndexedDB.
 * Per-answer review comments; review-only, must not appear in PDF solve view.
 */

import type { AnswerComment } from "@/domain/models/types";
import type { DbInstance } from "./db";

export async function putAnswerComment(db: DbInstance, entry: AnswerComment) {
  await db.put("answerComments", entry);
}

export async function getAnswerComment(
  db: DbInstance,
  sessionId: string,
  questionNumber: number
): Promise<AnswerComment | null> {
  const key = await db.getKeyFromIndex(
    "answerComments",
    "sessionId-questionNumber",
    [sessionId, questionNumber]
  );
  if (key == null) return null;
  const entry = await db.get("answerComments", key);
  return entry ?? null;
}

export async function listAnswerCommentsBySession(
  db: DbInstance,
  sessionId: string
): Promise<AnswerComment[]> {
  return db.getAllFromIndex("answerComments", "sessionId", sessionId);
}
