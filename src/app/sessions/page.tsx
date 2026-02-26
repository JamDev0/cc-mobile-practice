"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSessionFromPdf } from "@/features/session/service/sessionService";

export default function SessionsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        router.push(`/sessions/${result.sessionId}`);
      } else {
        setError(result.error);
      }
    },
    [router]
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
          gap: "0.5rem",
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
        <Link href="/" style={{ color: "#0070f3" }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
