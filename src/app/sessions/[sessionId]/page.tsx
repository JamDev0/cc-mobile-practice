"use client";

import dynamic from "next/dynamic";
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
        paddingBottom: "56px",
      }}
    >
      <header
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <h1>Session: {sessionId}</h1>
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
