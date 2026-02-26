import { defineConfig } from "@playwright/test";

/**
 * Playwright config for e2e smoke tests.
 * Release checklist (spec 04 §15): "Manual mobile smoke test on at least 2 viewport sizes"
 * These automated tests satisfy viewport coverage for CI; manual test still recommended.
 * Uses Chromium only (no WebKit) for predictable CI install.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3300",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
  webServer: {
    command: "PORT=3300 npm run dev",
    url: "http://127.0.0.1:3300",
    reuseExistingServer: false,
    timeout: 90000,
  },
});
