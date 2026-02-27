"use client";

import Link from "next/link";
import { useTheme, THEME_IDS } from "@/shared/theme/ThemeProvider";

const THEME_SWATCHES: Record<string, { accent: string; bg: string }> = {
  ink: { accent: "#14b8a6", bg: "#0a0a0b" },
  terra: { accent: "#c2410c", bg: "#f5f0e8" },
  frost: { accent: "#0284c7", bg: "#f0f4f8" },
  noir: { accent: "#e11d48", bg: "#0c0a09" },
  citrus: { accent: "#059669", bg: "#fafafa" },
};

export default function HomePage() {
  const { theme, setTheme, meta } = useTheme();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        gap: "2.5rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            lineHeight: 1.1,
            marginBottom: "0.75rem",
            color: "var(--color-text)",
          }}
        >
          Mobile Practice
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            maxWidth: "40ch",
            margin: "0 auto",
          }}
        >
          Solve PDF-based exams, capture answers, import answer keys, and review your grades.
        </p>
      </div>

      <Link
        href="/sessions"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.875rem 2rem",
          background: "var(--color-accent)",
          color: "var(--color-accent-text)",
          borderRadius: "var(--radius-lg)",
          textDecoration: "none",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          transition: "background 0.15s, transform 0.1s",
          minWidth: 200,
          minHeight: 48,
        }}
      >
        Open Sessions
      </Link>

      <section
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          Design variant
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.625rem",
          }}
        >
          {THEME_IDS.map((id) => {
            const isActive = theme === id;
            const swatch = THEME_SWATCHES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={isActive}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 0.375rem",
                  borderRadius: "var(--radius-lg)",
                  border: isActive
                    ? `2px solid var(--color-accent)`
                    : `1px solid var(--color-border)`,
                  background: isActive
                    ? "var(--color-accent-soft)"
                    : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: swatch.bg,
                    border: `3px solid ${swatch.accent}`,
                    boxShadow: isActive
                      ? `0 0 0 2px ${swatch.accent}40`
                      : undefined,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                    textTransform: "capitalize",
                  }}
                >
                  {meta[id].label}
                </span>
              </button>
            );
          })}
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {meta[theme].description}
        </p>
      </section>
    </main>
  );
}
