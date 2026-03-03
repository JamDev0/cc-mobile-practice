import type { HostAdapter } from "@cc-feedback/sdk-core";

export function createFeedbackHostAdapter(): HostAdapter {
  return {
    pausePolling: () => {},
    pauseRealtime: () => {},
    resumeAll: () => {},
    captureLogsWindow: () => [],
  };
}
