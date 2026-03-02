import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportGabaritoModal } from "./ImportGabaritoModal";
import type { ImportReport } from "@/domain/models/types";

const mockSuccess = vi.fn();

vi.mock("@/shared/hooks/useAppHaptics", () => ({
  useAppHaptics: () => ({
    selection: vi.fn(),
    success: mockSuccess,
    destructiveConfirm: vi.fn(),
  }),
}));

function makeImportReport(importedCount: number): ImportReport {
  return {
    totalTokens: 3,
    importedCount,
    skippedCount: importedCount === 0 ? 3 : 0,
    warnings: [],
  };
}

describe("ImportGabaritoModal haptics", () => {
  beforeEach(() => {
    cleanup();
    mockSuccess.mockClear();
  });

  it("triggers success haptic when import writes entries", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue(makeImportReport(2));

    render(
      <ImportGabaritoModal
        onImport={onImport}
        detectFormat={() => ({ mode: "A" })}
        onClose={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText("Paste text"), "1A,2B");
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("does not trigger success haptic when import writes nothing", async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue(makeImportReport(0));

    render(
      <ImportGabaritoModal
        onImport={onImport}
        detectFormat={() => ({ mode: "A" })}
        onClose={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText("Paste text"), "invalid");
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalled();
    });
    expect(mockSuccess).not.toHaveBeenCalled();
  });
});
