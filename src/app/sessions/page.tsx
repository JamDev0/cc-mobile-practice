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
    <main style={{ padding: "1rem" }}>
      <h1>Sessions</h1>
      <p style={{ margin: "1rem 0" }}>
        Create a session from a PDF or open an existing one.
      </p>
      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div>
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
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create session from PDF"}
          </button>
        </div>
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
        )}

        <section>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Existing sessions
          </h2>
          {loadingSessions ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              Loading sessions...
            </p>
          ) : sessionsError ? (
            <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>
              {sessionsError}
            </p>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              No sessions yet. Create one from a PDF above.
            </p>
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
                      padding: "0.75rem 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#111827",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{s.title}</span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        marginTop: "0.25rem",
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

        <Link href="/" style={{ color: "#0070f3" }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
