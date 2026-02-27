/**
 * IndexedDB schema and open logic per specs/01-domain-data-model-ralph-spec.md §5.
 * Database: mobile-practice-db, version 2 (v2: answerComments store for per-answer review comments).
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Session, Marker, GabaritoEntry, AnswerComment } from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";
const DB_VERSION = 2;

export interface PdfBlobRecord {
  sessionId: string;
  blob: Blob;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface MobilePracticeDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { updatedAt: number; createdAt: number };
  };
  pdfBlobs: {
    key: string;
    value: PdfBlobRecord;
  };
  markers: {
    key: string;
    value: Marker;
    indexes: {
      sessionId: string;
      "sessionId-questionNumber": [string, number];
      "sessionId-pageNumber": [string, number];
      updatedAt: number;
    };
  };
  gabaritoEntries: {
    key: string;
    value: GabaritoEntry;
    indexes: {
      sessionId: string;
      "sessionId-questionNumber": [string, number];
      updatedAt: number;
    };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
  answerComments: {
    key: string;
    value: AnswerComment;
    indexes: {
      sessionId: string;
      "sessionId-questionNumber": [string, number];
    };
  };
}

function upgradeV1(db: IDBPDatabase<MobilePracticeDB>) {
  const sessionsStore = db.createObjectStore("sessions", { keyPath: "id" });
  sessionsStore.createIndex("updatedAt", "updatedAt");
  sessionsStore.createIndex("createdAt", "createdAt");

  const pdfBlobsStore = db.createObjectStore("pdfBlobs", { keyPath: "sessionId" });

  const markersStore = db.createObjectStore("markers", { keyPath: "id" });
  markersStore.createIndex("sessionId", "sessionId");
  markersStore.createIndex("sessionId-questionNumber", ["sessionId", "questionNumber"]);
  markersStore.createIndex("sessionId-pageNumber", ["sessionId", "pageNumber"]);
  markersStore.createIndex("updatedAt", "updatedAt");

  const gabaritoStore = db.createObjectStore("gabaritoEntries", { keyPath: "id" });
  gabaritoStore.createIndex("sessionId", "sessionId");
  gabaritoStore.createIndex("sessionId-questionNumber", ["sessionId", "questionNumber"]);
  gabaritoStore.createIndex("updatedAt", "updatedAt");

  db.createObjectStore("meta", { keyPath: "key" });
}

function upgradeV2(db: IDBPDatabase<MobilePracticeDB>) {
  const store = db.createObjectStore("answerComments", { keyPath: "id" });
  store.createIndex("sessionId", "sessionId");
  store.createIndex("sessionId-questionNumber", ["sessionId", "questionNumber"]);
}

export function openDatabase() {
  return openDB<MobilePracticeDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) upgradeV1(db);
      if (oldVersion < 2) upgradeV2(db);
    },
  });
}

export type DbInstance = Awaited<ReturnType<typeof openDatabase>>;
