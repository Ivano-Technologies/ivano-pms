import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Inbox, Settings } from "lucide-react";

import { CommandPaletteShell } from "./command-palette-shell";

const TEST_ITEMS = [
  { id: "inbox", label: "Go to Inbox", hint: "Guest threads", icon: Inbox },
  { id: "settings", label: "Go to Settings", hint: "Channels", icon: Settings }
];

describe("CommandPaletteShell", () => {
  it("opens on Ctrl+K with plain-language navigation items", () => {
    render(<CommandPaletteShell items={TEST_ITEMS} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const dialog = screen.getByRole("dialog", { name: /command palette/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Go to Inbox")).toBeInTheDocument();
    expect(screen.getByText("Go to Settings")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CommandPaletteShell items={TEST_ITEMS} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onSelect when an item is chosen", () => {
    const onSelect = vi.fn();
    render(<CommandPaletteShell items={TEST_ITEMS} onSelect={onSelect} open />);

    fireEvent.click(screen.getByRole("option", { name: /go to inbox/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "inbox", label: "Go to Inbox" })
    );
  });
});
