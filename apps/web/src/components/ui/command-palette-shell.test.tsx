import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { CommandPaletteShell } from "./command-palette-shell";

describe("CommandPaletteShell", () => {
  it("opens on Ctrl+K with plain-language navigation items", () => {
    render(<CommandPaletteShell />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const dialog = screen.getByRole("dialog", { name: /command palette/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Go to Inbox")).toBeInTheDocument();
    expect(screen.getByText("Go to Bookings")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CommandPaletteShell />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
