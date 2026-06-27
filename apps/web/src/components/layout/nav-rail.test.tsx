import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings"
}));

import { NavRail } from "./nav-rail";

describe("NavRail", () => {
  it("highlights settings when channel cards are visible", () => {
    render(<NavRail />);
    const settings = screen.getByRole("link", { name: "Settings" });
    expect(settings).toHaveAttribute("aria-current", "page");
  });

  it("lists guests for bulk import access on desktop", () => {
    render(<NavRail />);
    expect(screen.getByRole("link", { name: "Guests" })).toHaveAttribute(
      "href",
      "/dashboard/guests"
    );
  });
});
