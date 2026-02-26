"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TabBar } from "@/shared/ui/TabBar";

type TabId = "solve" | "review" | "session";

const TABS: { id: TabId; label: string }[] = [
  { id: "solve", label: "Solve" },
  { id: "review", label: "Review" },
  { id: "session", label: "Session" },
];

function TabContent({ tabId }: { tabId: TabId }) {
  switch (tabId) {
    case "solve":
      return <p>Solve: PDF viewport and markers (placeholder)</p>;
    case "review":
      return <p>Review: graded rows and answers (placeholder)</p>;
    case "session":
      return <p>Session: metadata and data loss warning (placeholder)</p>;
    default:
      return null;
  }
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [activeTab, setActiveTab] = useState<TabId>("solve");

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
      <div style={{ flex: 1, padding: "1rem" }}>
        <TabContent tabId={activeTab} />
      </div>
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
      />
    </main>
  );
}
