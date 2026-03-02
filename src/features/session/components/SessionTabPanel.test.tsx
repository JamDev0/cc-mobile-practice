/**
 * Session tab tests per specs/00-system-contract-ralph-spec.md §9.
 * Verifies mandatory data loss warning, session metadata display, and delete session.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deleteDB } from "idb";
import { openDatabase } from "@/storage/indexeddb/db";
import { putSession } from "@/storage/indexeddb/sessionAdapter";
import { putPdfBlob } from "@/storage/indexeddb/pdfBlobAdapter";
import { SessionTabPanel } from "./SessionTabPanel";
import type { Session } from "@/domain/models/types";

const DB_NAME = "mobile-practice-db";

const mockPush = vi.fn();
const mockDestructiveConfirm = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("@/shared/hooks/useAppHaptics", () => ({
  useAppHaptics: () => ({
    selection: vi.fn(),
    success: vi.fn(),
    destructiveConfirm: mockDestructiveConfirm,
  }),
}));

const DEFAULT_UI = {
  activeTab: "session" as const,
  handedness: "right" as const,
  zoomMode: "free" as const,
  lastViewedPage: 1,
};

function mkSession(overrides: Partial<Session> = {}): Session {
  const now = Date.now();
  return {
    id: "session-tab-test",
    title: "Practice Exam",
    createdAt: now,
    updatedAt: now,
    pdfFileName: "exam.pdf",
    pdfMimeType: "application/pdf",
    pdfByteLength: 1024 * 500,
    pdfSha256: "",
    pageCount: 10,
    lastInsertedQuestionNumber: null,
    ui: DEFAULT_UI,
    ...overrides,
  };
}

describe("SessionTabPanel - Data Loss Warning (Spec 00 §9)", () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockDestructiveConfirm.mockClear();
    await deleteDB(DB_NAME);
  });

  it("displays mandatory data loss warning - first sentence", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    await putPdfBlob(db, sessionId, new Blob(["%PDF"], { type: "application/pdf" }));
    db.close();

    render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(
        screen.getByText(/your data is stored only in this browser on this device/i)
      ).toBeInTheDocument();
    });
  });

  it("displays mandatory data loss warning - second sentence", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(
        screen.getByText(/clearing browser data may delete your sessions permanently/i)
      ).toBeInTheDocument();
    });
  });

  it("displays session metadata when session exists", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({
      id: sessionId,
      title: "Practice Exam",
      pdfFileName: "exam.pdf",
      pageCount: 10,
    });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { container } = render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const wrapper = within(container);
    expect(wrapper.getByText("Practice Exam")).toBeInTheDocument();
    expect(wrapper.getByText("exam.pdf")).toBeInTheDocument();
    expect(wrapper.getByText("10")).toBeInTheDocument();
  });

  it("shows error when session not found", async () => {
    render(<SessionTabPanel sessionId="nonexistent-session" />);

    await waitFor(() => {
      expect(screen.getByText(/session not found/i)).toBeInTheDocument();
    });
  });

  it("SSN: Switch session link visible when session exists", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { container } = render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const wrapper = within(container);
    const link = wrapper.getByTestId("switch-session-link-session-tab");
    expect(link).toHaveAttribute("href", "/sessions");
    expect(link).toHaveAccessibleName("Switch session");
  });

  it("SSN: Switch session link visible when session not found", async () => {
    const { container } = render(
      <SessionTabPanel sessionId="nonexistent-session" />
    );

    const wrapper = within(container);
    await waitFor(() => {
      expect(wrapper.getByText(/session not found/i)).toBeInTheDocument();
      expect(wrapper.getByTestId("switch-session-link-session-tab")).toBeInTheDocument();
    });

    const link = wrapper.getByTestId("switch-session-link-session-tab");
    expect(link).toHaveAttribute("href", "/sessions");
  });

  it("shows delete session button when session exists", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const { container } = render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const wrapper = within(container);
    const deleteBtn = wrapper.getByTestId("delete-session-button");
    expect(deleteBtn).toHaveTextContent("Delete session");
  });

  it("Cancel closes modal without deleting", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const user = userEvent.setup();
    const { container } = render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const wrapper = within(container);
    await user.click(wrapper.getByTestId("delete-session-button"));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /delete session confirmation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("delete-session-cancel"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("confirm deletes and redirects to /sessions", async () => {
    const sessionId = "session-tab-test";
    const session = mkSession({ id: sessionId });
    const db = await openDatabase();
    await putSession(db, session);
    db.close();

    const user = userEvent.setup();
    const { container } = render(<SessionTabPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const wrapper = within(container);
    await user.click(wrapper.getByTestId("delete-session-button"));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /delete session confirmation/i })).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("delete-session-confirm"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/sessions");
    });
    expect(mockDestructiveConfirm).toHaveBeenCalledTimes(1);
  });
});
