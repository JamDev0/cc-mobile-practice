"use client";

interface SolveHeaderProps {
  sessionTitle: string;
  currentPage: number;
  pageCount: number | null;
  hasConflict: boolean;
}

export function SolveHeader({
  sessionTitle,
  currentPage,
  pageCount,
  hasConflict,
}: SolveHeaderProps) {
  const pageIndicator =
    pageCount != null ? `${currentPage} / ${pageCount}` : "-";

  return (
    <header
      style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "1rem",
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "60%",
        }}
      >
        {sessionTitle}
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          {pageIndicator}
        </span>
        {hasConflict && (
          <span
            style={{
              padding: "0.25rem 0.5rem",
              background: "#fef3c7",
              color: "#92400e",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            Conflict
          </span>
        )}
      </div>
    </header>
  );
}
