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
        background: "var(--color-modal-backdrop)",
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
          background: "var(--color-surface)",
          borderRadius: "var(--radius-modal)",
          padding: "1.5rem",
          maxWidth: 320,
          width: "100%",
          border: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h3
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.125rem",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
          }}
        >
          Delete session
        </h3>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "var(--color-text)" }}>
          Permanently delete &quot;{sessionTitle}&quot;?
        </p>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
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
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              cursor: "pointer",
              minHeight: 40,
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
              border: "none",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 40,
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
        <p style={{ color: "var(--color-danger)" }}>{error}</p>
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
            borderRadius: "var(--radius-md)",
            border: `1px solid var(--color-accent)`,
            background: "var(--color-accent-soft)",
            color: "var(--color-accent)",
            fontSize: "0.875rem",
            fontWeight: 600,
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
      <div style={{ padding: "1rem", color: "var(--color-text-muted)" }}>
        Loading session...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
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
          borderRadius: "var(--radius-md)",
          border: `1px solid var(--color-accent)`,
          background: "var(--color-accent-soft)",
          color: "var(--color-accent)",
          fontSize: "0.8125rem",
          fontWeight: 600,
          textDecoration: "none",
        }}
        aria-label="Switch session"
      >
        Switch session
      </Link>

      <section>
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 0.75rem 0",
            color: "var(--color-text-muted)",
          }}
        >
          Session info
        </h2>
        <dl
          style={{
            margin: 0,
            display: "grid",
            gap: "0.625rem",
            fontSize: "0.875rem",
          }}
        >
          {[
            { label: "Title", value: session.title },
            { label: "PDF file", value: session.pdfFileName },
            { label: "Size", value: formatByteLength(session.pdfByteLength) },
            { label: "Created", value: formatDate(session.createdAt) },
            ...(session.pageCount !== null ? [{ label: "Pages", value: String(session.pageCount) }] : []),
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <dt style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>{label}</dt>
              <dd style={{ margin: 0, color: "var(--color-text)", fontFamily: label === "Size" ? "var(--font-family-mono)" : "inherit" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        role="alert"
        aria-live="polite"
        style={{
          padding: "1rem",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-warning-bg)",
          border: `1px solid var(--color-warning-border)`,
        }}
      >
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 0.5rem 0",
            color: "var(--color-warning-text)",
          }}
        >
          Data storage
        </h2>
        <p
          style={{
            margin: "0 0 0.375rem 0",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
          }}
        >
          Your data is stored only in this browser on this device.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
          }}
        >
          Clearing browser data may delete your sessions permanently.
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 0.75rem 0",
            color: "var(--color-danger)",
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
            border: `1px solid var(--color-danger)`,
            borderRadius: "var(--radius-md)",
            background: "var(--color-danger-soft)",
            color: "var(--color-danger)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: isDeleting ? "not-allowed" : "pointer",
            minHeight: 44,
          }}
        >
          {isDeleting ? "Deleting\u2026" : "Delete session"}
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
