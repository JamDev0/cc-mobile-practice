import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabBar } from "./TabBar";

describe("TabBar", () => {
  const tabs = [
    { id: "solve" as const, label: "Solve" },
    { id: "review" as const, label: "Review" },
    { id: "session" as const, label: "Session" },
  ];

  it("renders all tabs", () => {
    const { container } = render(
      <TabBar tabs={tabs} activeTab="solve" onTabChange={() => {}} />
    );
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
    const { getByRole } = within(nav ?? document.body);
    expect(getByRole("tab", { name: /solve/i })).toBeInTheDocument();
    expect(getByRole("tab", { name: /review/i })).toBeInTheDocument();
    expect(getByRole("tab", { name: /session/i })).toBeInTheDocument();
  });

  it("calls onTabChange when tab is clicked", async () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <TabBar tabs={tabs} activeTab="solve" onTabChange={onTabChange} />
    );
    const nav = container.querySelector("nav");
    const { getByRole } = within(nav ?? document.body);
    await userEvent.click(getByRole("tab", { name: /review/i }));
    expect(onTabChange).toHaveBeenCalledWith("review");
  });

  it("marks active tab with aria-selected", () => {
    const { container } = render(
      <TabBar tabs={tabs} activeTab="review" onTabChange={() => {}} />
    );
    const nav = container.querySelector("nav");
    const { getByRole } = within(nav ?? document.body);
    expect(getByRole("tab", { name: /review/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  describe("NPI (Spec 07 - Tab bar pointer isolation)", () => {
    it("NPI-01: Tap each tab changes active tab correctly", async () => {
      const onTabChange = vi.fn();
      const { container } = render(
        <TabBar tabs={tabs} activeTab="solve" onTabChange={onTabChange} />
      );
      const nav = container.querySelector("nav");
      const { getByRole } = within(nav ?? document.body);
      await userEvent.click(getByRole("tab", { name: /review/i }));
      expect(onTabChange).toHaveBeenCalledWith("review");
      await userEvent.click(getByRole("tab", { name: /session/i }));
      expect(onTabChange).toHaveBeenCalledWith("session");
    });

    it("NPI: Tab bar has explicit z-index for stacking above solve viewport", () => {
      const { container } = render(
        <TabBar tabs={tabs} activeTab="solve" onTabChange={() => {}} />
      );
      const nav = container.querySelector("nav");
      expect(nav).toHaveStyle({ zIndex: "100" });
    });

    it("NPI: Each tab has minimum 44x44 hit target", () => {
      const { container } = render(
        <TabBar tabs={tabs} activeTab="solve" onTabChange={() => {}} />
      );
      const nav = container.querySelector("nav");
      const { getByRole } = within(nav ?? document.body);
      const solveTab = getByRole("tab", { name: /solve/i });
      const styles = window.getComputedStyle(solveTab);
      const minWidth = parseInt(styles.minWidth ?? "0", 10);
      const minHeight = parseInt(styles.minHeight ?? "0", 10);
      expect(minWidth).toBeGreaterThanOrEqual(44);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });
});
