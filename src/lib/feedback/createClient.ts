import { FeedbackClient, type HostAdapter } from "@cc-feedback/sdk-core";

const FEEDBACK_ENDPOINT =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_FEEDBACK_ENDPOINT
    ? process.env.NEXT_PUBLIC_FEEDBACK_ENDPOINT
    : "http://localhost:8787/v1/feedback";

export function createFeedbackClient(hostAdapter?: HostAdapter) {
  return new FeedbackClient(
    {
      endpointUrl: FEEDBACK_ENDPOINT,
      sdkVersion: "0.1.0",
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "mobile-practice",
      requestTimeoutMs: 10_000,
    },
    hostAdapter
  );
}
