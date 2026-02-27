"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TabBar } from "@/shared/ui/TabBar";
import { SessionTabPanel } from "@/features/session/components/SessionTabPanel";
import type { JumpRequest } from "@/features/solve/types";

const SolveScreen = dynamic(
  () =>
    import("@/features/solve/components/SolveScreen").then((m) => ({
      default: m.SolveScreen,
    })),
  { ssr: false }
);

const ReviewScreen = dynamic(
  () =>
    import("@/features/review/components/ReviewScreen").then((m) => ({
      default: m.ReviewScreen,
    })),
  { ssr: false }
);

type TabId = "solve" | "review" | "session";

const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

function TabContent({
  tabId,
  sessionId,
  jumpRequest,
  onJumpRequestConsumed,
  onRequestJump,
}: {
  tabId: TabId;
  sessionId: string;
  jumpRequest: JumpRequest | null;
  onJumpRequestConsumed: () => void;
  onRequestJump: (req: JumpRequest) => void;
}) {
  switch (tabId) {
    case "solve":
      return (
        <SolveScreen
          sessionId={sessionId}
          jumpRequest={jumpRequest}
          onJumpRequestConsumed={onJumpRequestConsumed}
        />
      );
    case "review":
      return (
        <ReviewScreen
          sessionId={sessionId}
          onRequestJump={onRequestJump}
        />
      );
    case "session":
      return <SessionTabPanel sessionId={sessionId} />;
    default:
      return null;
  }
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [activeTab, setActiveTab] = useState<TabId>("solve");
  const [pendingJumpRequest, setPendingJumpRequest] =
    useState<JumpRequest | null>(null);

  useEffect(() => {
    if (pendingJumpRequest?.sessionId === sessionId) {
      setActiveTab("solve");
    }
  }, [pendingJumpRequest, sessionId]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: "100dvh",
        paddingBottom: "max(56px, calc(56px + env(safe-area-inset-bottom, 0px)))",
      }}
    >
      <header
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Session: {sessionId}</h1>
        <Link
          href="/sessions"
          data-testid="switch-session-link-header"
          style={{
            minWidth: 44,
            minHeight: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
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
      </header>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: activeTab === "solve" ? 0 : "1rem" }}>
        <TabContent
          tabId={activeTab}
          sessionId={sessionId}
          jumpRequest={pendingJumpRequest}
          onJumpRequestConsumed={() => setPendingJumpRequest(null)}
          onRequestJump={setPendingJumpRequest}
        />
      </div>
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />
    </main>
  );
}
