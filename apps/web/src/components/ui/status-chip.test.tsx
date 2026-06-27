import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusChip } from "./status-chip";

describe("StatusChip", () => {
  it("renders label text for screen readers and sighted users", () => {
    render(<StatusChip tone="success">Confirmed</StatusChip>);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("exposes status role for assistive tech", () => {
    render(<StatusChip tone="warning">Awaiting reply</StatusChip>);
    expect(screen.getByRole("status")).toHaveTextContent("Awaiting reply");
  });

  it("applies channel tone without relying on color alone (shows label)", () => {
    render(<StatusChip tone="info">Telegram</StatusChip>);
    const chip = screen.getByRole("status");
    expect(chip).toHaveAttribute("data-tone", "info");
    expect(chip.textContent).toBe("Telegram");
  });
});
