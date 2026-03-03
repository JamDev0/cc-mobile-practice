"use client";

import { useMemo, useState } from "react";
import { FeedbackOverlay } from "@cc-feedback/ui";
import { createFeedbackClient } from "@/lib/feedback/createClient";
import { createFeedbackHostAdapter } from "@/lib/feedback/hostAdapter";

export function FeedbackTrigger() {
  const [open, setOpen] = useState(false);
  const sessionFingerprint = useMemo(() => crypto.randomUUID(), []);
  const client = useMemo(
    () => createFeedbackClient(createFeedbackHostAdapter()),
    []
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="feedback-trigger"
        aria-label="Share your thoughts or suggest an improvement"
        title="We read every response — quick to share"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="feedback-trigger-label">Share your thoughts</span>
      </button>
      {open ? (
        <FeedbackOverlay
          client={client}
          sessionFingerprint={sessionFingerprint}
          route={
            typeof window !== "undefined" ? window.location.pathname : undefined
          }
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
