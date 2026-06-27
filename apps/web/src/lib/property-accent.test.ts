import { describe, expect, it } from "vitest";

import { getPropertyAccentColor } from "./property-accent";

describe("getPropertyAccentColor", () => {
  it("returns a stable hex color for the same property id", () => {
    const id = "jd7abc123";
    expect(getPropertyAccentColor(id)).toBe(getPropertyAccentColor(id));
    expect(getPropertyAccentColor(id)).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
