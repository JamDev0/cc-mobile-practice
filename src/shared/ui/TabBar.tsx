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
        borderTop: `1px solid var(--color-border)`,
        background: "var(--color-surface)",
        minHeight: "56px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 100,
        isolation: "isolate",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: "12px 8px",
              minWidth: "44px",
              minHeight: "44px",
              border: "none",
              borderTop: isActive
                ? `2px solid var(--color-accent)`
                : "2px solid transparent",
              background: isActive
                ? "var(--color-tab-active-bg)"
                : "transparent",
              color: isActive
                ? "var(--color-tab-active-fg)"
                : "var(--color-tab-inactive-fg)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: isActive ? 700 : 500,
              fontFamily: "inherit",
              letterSpacing: isActive ? "-0.01em" : "0.01em",
              transition: "color 0.15s, background 0.15s, border-color 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
