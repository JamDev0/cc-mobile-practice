"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { openDatabase } from "@/storage/indexeddb/db";
import {
  getSession,
  deleteSessionCascade,
} from "@/storage/indexeddb/sessionAdapter";
import type { Session } from "@/domain/models/types";

/**
 * Session tab panel per specs/00-system-contract-ralph-spec.md §9.
 * Displays session metadata and mandatory data loss warning.
 */

export interface SessionTabPanelProps {
  sessionId: string;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function formatByteLength(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DeleteSessionConfirmModal({
  sessionTitle,
  onConfirm,
  onCancel,
}: {
  sessionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      role="dialog"
      aria-label="Delete session confirmation"
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.125rem",
            color: "#1f2937",
          }}
        >
          Delete session
        </h3>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
          Permanently delete &quot;{sessionTitle}&quot;?
        </p>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          This cannot be undone. The session, PDF, markers, and answers will be
          permanently removed.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            data-testid="delete-session-cancel"
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "white",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid="delete-session-confirm"
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #dc2626",
              borderRadius: 6,
              background: "#dc2626",
              color: "white",
              fontSize: "0.875rem",
            }}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export function SessionTabPanel({ sessionId }: SessionTabPanelProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const db = await openDatabase();
      const s = await getSession(db, sessionId);
      db.close();
      setSession(s ?? null);
      setError(s ? null : "Session not found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!session || isDeleting) return;
    setIsDeleting(true);
    try {
      const db = await openDatabase();
      await deleteSessionCascade(db, sessionId);
      db.close();
      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsDeleting(false);
    }
  }, [session, sessionId, isDeleting, router]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  if (error) {
    return (
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#c5221f" }}>{error}</p>
        <Link
          href="/sessions"
          data-testid="switch-session-link-session-tab"
          style={{
            minWidth: 44,
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-start",
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
            border: "1px solid #2563eb",
            background: "white",
            color: "#2563eb",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
          aria-label="Switch session"
        >
          Switch session
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: "1rem" }}>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <Link
        href="/sessions"
        data-testid="switch-session-link-session-tab"
        style={{
          minWidth: 44,
          minHeight: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "flex-start",
          padding: "0.5rem 0.75rem",
          borderRadius: 6,
          border: "1px solid #2563eb",
          background: "white",
          color: "#2563eb",
          fontSize: "0.875rem",
          fontWeight: 500,
          textDecoration: "none",
        }}
        aria-label="Switch session"
      >
        Switch session
      </Link>
      <section>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            margin: "0 0 0.5rem 0",
            color: "#202124",
          }}
        >
          Session info
        </h2>
        <dl
          style={{
            margin: 0,
            display: "grid",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <div>
            <dt style={{ fontWeight: 500, color: "#5f6368" }}>Title</dt>
            <dd style={{ margin: "0.25rem 0 0 0" }}>{session.title}</dd>
          </div>
          <div>
            <dt style={{ fontWeight: 500, color: "#5f6368" }}>PDF file</dt>
            <dd style={{ margin: "0.25rem 0 0 0" }}>{session.pdfFileName}</dd>
          </div>
          <div>
            <dt style={{ fontWeight: 500, color: "#5f6368" }}>Size</dt>
            <dd style={{ margin: "0.25rem 0 0 0" }}>
              {formatByteLength(session.pdfByteLength)}
            </dd>
          </div>
          <div>
            <dt style={{ fontWeight: 500, color: "#5f6368" }}>Created</dt>
            <dd style={{ margin: "0.25rem 0 0 0" }}>
              {formatDate(session.createdAt)}
            </dd>
          </div>
          {session.pageCount !== null && (
            <div>
              <dt style={{ fontWeight: 500, color: "#5f6368" }}>Pages</dt>
              <dd style={{ margin: "0.25rem 0 0 0" }}>{session.pageCount}</dd>
            </div>
          )}
        </dl>
      </section>

      <section
        role="alert"
        aria-live="polite"
        style={{
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "#fef7e0",
          border: "1px solid #f9a825",
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            margin: "0 0 0.5rem 0",
            color: "#b06000",
          }}
        >
          Data storage
        </h2>
        <p
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "0.9rem",
            lineHeight: 1.5,
            color: "#333",
          }}
        >
          Your data is stored only in this browser on this device.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            lineHeight: 1.5,
            color: "#333",
          }}
        >
          Clearing browser data may delete your sessions permanently.
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            margin: "0 0 0.5rem 0",
            color: "#202124",
          }}
        >
          Danger zone
        </h2>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          data-testid="delete-session-button"
          disabled={isDeleting}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #dc2626",
            borderRadius: 6,
            background: "white",
            color: "#dc2626",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {isDeleting ? "Deleting…" : "Delete session"}
        </button>
      </section>

      {showDeleteModal && (
        <DeleteSessionConfirmModal
          sessionTitle={session.title}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
