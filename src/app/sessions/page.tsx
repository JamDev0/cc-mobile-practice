import Link from "next/link";

export default function SessionsPage() {
  return (
    <main style={{ padding: "1rem" }}>
      <h1>Sessions</h1>
      <p style={{ margin: "1rem 0" }}>
        Session list - create or open a session.
      </p>
      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Link
          href="/sessions/sample-session-id"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Open sample session
        </Link>
        <Link href="/" style={{ color: "#0070f3" }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
