import { describe, expect, it } from "vitest";

import {
  MOBILE_TAB_ITEMS,
  SHELL_NAV_ITEMS,
  isNavItemActive
} from "./shell-navigation";

describe("shell-navigation", () => {
  it("does not expose deferred channel/inbox navigation", () => {
    expect(SHELL_NAV_ITEMS.find((item) => item.id === "inbox")).toBeUndefined();
  });

  it("keeps settings for property configuration", () => {
    const settings = SHELL_NAV_ITEMS.find((item) => item.id === "settings");
    expect(settings?.href).toBe("/dashboard/settings");
  });

  it("keeps guests reachable for bulk import", () => {
    const guests = SHELL_NAV_ITEMS.find((item) => item.id === "guests");
    expect(guests?.href).toBe("/dashboard/guests");
    expect(guests?.hint).toMatch(/import/i);
  });

  it("limits mobile tabs to five primary destinations", () => {
    expect(MOBILE_TAB_ITEMS).toHaveLength(5);
    expect(MOBILE_TAB_ITEMS.map((item) => item.id)).toEqual([
      "overview",
      "bookings",
      "guests",
      "reports",
      "settings"
    ]);
  });

  it("treats /dashboard as exact match for overview only", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard/guests", "/dashboard")).toBe(false);
    expect(isNavItemActive("/dashboard/guests", "/dashboard/guests")).toBe(true);
  });
});
