"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SessionTabPanel } from "@/features/session/components/SessionTabPanel";
import { TerraSessionShell } from "@/variants/terra";
import type { JumpRequest } from "@/features/solve/types";
import type { TabId } from "@/variants/types";

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

  const tabContent = (
    <TabContent
      tabId={activeTab}
      sessionId={sessionId}
      jumpRequest={pendingJumpRequest}
      onJumpRequestConsumed={() => setPendingJumpRequest(null)}
      onRequestJump={setPendingJumpRequest}
    />
  );

  return (
    <TerraSessionShell
      sessionId={sessionId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {tabContent}
    </TerraSessionShell>
  );
}
