"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSessionFromPdf,
  listSessions,
} from "@/features/session/service/sessionService";
import type { Session } from "@/domain/models/types";

export default function SessionsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    const result = await listSessions();
    setLoadingSessions(false);
    if (result.ok) {
      setSessions(result.sessions);
    } else {
      setSessionsError(result.error);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (!loadingSessions) {
      markViewInteractive("sessions");
    }
  }, [loadingSessions]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setCreating(true);
      const result = await createSessionFromPdf(file);
      setCreating(false);
      e.target.value = "";
      if (result.ok) {
        await refreshSessions();
        router.push(`/sessions/${result.sessionId}`);
      } else {
        setError(result.error);
      }
    },
    [router, refreshSessions]
  );

  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "1.5rem",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            color: "var(--color-text)",
          }}
        >
          Sessions
        </h1>
        <Link
          href="/"
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-accent)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Home
        </Link>
      </div>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-text-secondary)",
          marginBottom: "1.25rem",
          lineHeight: 1.5,
        }}
      >
        Create a session from a PDF or open an existing one.
      </p>

      <div style={{ marginBottom: "2rem" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={creating}
          style={{
            width: "100%",
            padding: "0.875rem 1.25rem",
            background: "var(--color-accent)",
            color: "var(--color-accent-text)",
            borderRadius: "var(--radius-lg)",
            border: "none",
            cursor: creating ? "not-allowed" : "pointer",
            fontSize: "0.9375rem",
            fontWeight: 600,
            opacity: creating ? 0.6 : 1,
            transition: "opacity 0.15s",
            minHeight: 48,
          }}
        >
          {creating ? "Creating..." : "Create session from PDF"}
        </button>
      </div>

      {error && (
        <p
          style={{
            color: "var(--color-danger)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "var(--color-danger-soft)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {error}
        </p>
      )}

      <section>
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          Existing sessions
        </h2>

        {loadingSessions ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Loading sessions...
          </div>
        ) : sessionsError ? (
          <p
            style={{
              color: "var(--color-danger)",
              fontSize: "0.875rem",
              padding: "0.75rem",
              background: "var(--color-danger-soft)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {sessionsError}
          </p>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              borderRadius: "var(--radius-lg)",
              border: `1px dashed var(--color-border)`,
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            No sessions yet. Create one from a PDF above.
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}`}
                  style={{
                    display: "block",
                    padding: "1rem 1.25rem",
                    border: `1px solid var(--color-border)`,
                    borderRadius: "var(--radius-lg)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    textDecoration: "none",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      letterSpacing: "var(--letter-spacing-heading)",
                    }}
                  >
                    {s.title}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      marginTop: "0.375rem",
                      fontFamily: "var(--font-family-mono)",
                    }}
                  >
                    {new Date(s.updatedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
