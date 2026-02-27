/**
 * Viewport smoke tests for release checklist (spec 04 §15).
 * Verifies core routes render correctly at mobile and tablet viewport sizes.
 */

import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders title and sessions link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Mobile Practice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Sessions" })).toBeVisible();
  });
});

test.describe("Sessions page", () => {
  test("renders create session button and heading", async ({ page }) => {
    await page.goto("/sessions");
    await expect(page.getByRole("heading", { name: "Sessions", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create session from PDF/i })
    ).toBeVisible();
  });

  test("shows existing sessions section", async ({ page }) => {
    await page.goto("/sessions");
    await expect(page.getByRole("heading", { name: "Existing sessions" })).toBeVisible();
  });
});

test.describe("Session page (tabbed layout)", () => {
  test("renders tab bar with Solve, Review, Session", async ({ page }) => {
    await page.goto("/sessions/test-session-id");
    await expect(page.getByRole("tab", { name: "Solve" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Review" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Session" })).toBeVisible();
  });

  test("NPI-01: Tap each tab from Solve view changes active tab correctly", async ({
    page,
  }) => {
    await page.goto("/sessions/test-session-id");
    await page.getByRole("tab", { name: "Review" }).click();
    await expect(page.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.getByRole("tab", { name: "Session" }).click();
    await expect(page.getByRole("tab", { name: "Session" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.getByRole("tab", { name: "Solve" }).click();
    await expect(page.getByRole("tab", { name: "Solve" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("Session tab loads content", async ({ page }) => {
    await page.goto("/sessions/test-session-id");
    await page.getByRole("tab", { name: "Session" }).click();
    // Non-existent session shows "Session not found"; existing session would show data loss warning.
    // Either way confirms Session tab and TabContent render at viewport size.
    await expect(
      page.getByText(/Session not found|Your data is stored only in this browser/i)
    ).toBeVisible();
  });

  test("SSN-01: Switch session affordance visible", async ({ page }) => {
    await page.goto("/sessions/test-session-id");
    await expect(
      page.getByRole("link", { name: "Switch session" })
    ).toBeVisible();
  });

  test("SSN-02: Activate switch action navigates to /sessions", async ({
    page,
  }) => {
    await page.goto("/sessions/test-session-id");
    await page.getByRole("link", { name: "Switch session" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
  });

  test("SSN-03: Keyboard activation navigates to /sessions", async ({
    page,
  }) => {
    await page.goto("/sessions/test-session-id");
    await page.getByRole("link", { name: "Switch session" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sessions$/);
  });

  test("SSN-04: Session-not-found route has switch affordance", async ({
    page,
  }) => {
    await page.goto("/sessions/nonexistent-session-id");
    await expect(
      page.getByRole("link", { name: "Switch session" })
    ).toBeVisible();
  });
});
