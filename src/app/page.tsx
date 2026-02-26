import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "1rem", textAlign: "center" }}>
      <h1>Mobile Practice</h1>
      <p style={{ margin: "1rem 0" }}>
        Mobile web app for solving PDF-based exams.
      </p>
      <Link
        href="/sessions"
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          background: "#0070f3",
          color: "white",
          borderRadius: "4px",
          textDecoration: "none",
        }}
      >
        Go to Sessions
      </Link>
    </main>
  );
}
