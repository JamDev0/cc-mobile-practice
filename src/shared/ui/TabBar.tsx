"use client";

import React from "react";

export interface TabBarProps<T extends string> {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
}

export function TabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabBarProps<T>) {
  return (
    <nav
      role="tablist"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        borderTop: "1px solid #eee",
        background: "#fff",
        minHeight: "56px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 100,
        isolation: "isolate",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: "12px 8px",
            minWidth: "44px",
            minHeight: "44px",
            border: "none",
            background: activeTab === tab.id ? "#e8f0fe" : "transparent",
            color: activeTab === tab.id ? "#1967d2" : "#5f6368",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
