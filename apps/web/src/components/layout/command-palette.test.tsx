import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/dashboard"
}));

import { CommandPalette } from "./command-palette";

describe("CommandPalette", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("navigates to inbox route when a command is selected", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByRole("option", { name: /go to inbox/i }));

    expect(push).toHaveBeenCalledWith("/dashboard/inbox");
  });

  it("navigates to settings for channel integrations", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByRole("option", { name: /go to settings/i }));

    expect(push).toHaveBeenCalledWith("/dashboard/settings");
  });

  it("navigates to guests for spreadsheet import workflow", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.click(screen.getByRole("option", { name: /go to guests/i }));

    expect(push).toHaveBeenCalledWith("/dashboard/guests");
  });
});
