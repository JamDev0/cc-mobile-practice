"use client";

import dynamic from "next/dynamic";

const FeedbackTrigger = dynamic(
  () =>
    import("@/components/FeedbackTrigger").then((mod) => ({
      default: mod.FeedbackTrigger,
    })),
  { ssr: false }
);

export function FeedbackTriggerClient() {
  return <FeedbackTrigger />;
}
