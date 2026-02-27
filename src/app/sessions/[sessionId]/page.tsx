"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { SessionTabPanel } from "@/features/session/components/SessionTabPanel";
import { InkSessionShell } from "@/variants/ink";
import { TerraSessionShell } from "@/variants/terra";
import { FrostSessionShell } from "@/variants/frost";
import { NoirSessionShell } from "@/variants/noir";
import { CitrusSessionShell } from "@/variants/citrus";
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
  const { theme } = useTheme();
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

  const shellProps = {
    sessionId,
    activeTab,
    onTabChange: setActiveTab,
    children: tabContent,
  };

  switch (theme) {
    case "ink":
      return <InkSessionShell {...shellProps} />;
    case "terra":
      return <TerraSessionShell {...shellProps} />;
    case "frost":
      return <FrostSessionShell {...shellProps} />;
    case "noir":
      return <NoirSessionShell {...shellProps} />;
    case "citrus":
      return <CitrusSessionShell {...shellProps} />;
  }
}
