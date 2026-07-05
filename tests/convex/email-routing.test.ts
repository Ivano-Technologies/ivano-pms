import { describe, expect, it } from "vitest";

import {
  formatInboundEmailAddress,
  parseBookingPlusAddress,
  slugifyPropertyName
} from "../../convex/lib/emailRouting";

describe("email plus-address routing (6.2.1)", () => {
  it("slugifies property names", () => {
    expect(slugifyPropertyName("Gwarimpa Estate")).toBe("gwarimpa-estate");
    expect(slugifyPropertyName("  Lake View #2 ")).toBe("lake-view-2");
  });

  it("formats booking+<slug>@pms.techivano.com", () => {
    expect(formatInboundEmailAddress("gwarimpa-estate")).toBe(
      "booking+gwarimpa-estate@pms.techivano.com"
    );
  });

  it("parses plus-tag from inbound address", () => {
    expect(
      parseBookingPlusAddress("booking+gwarimpa-estate@pms.techivano.com")
    ).toEqual({ slug: "gwarimpa-estate" });
    expect(
      parseBookingPlusAddress("Booking+Gwarimpa-Estate@PMS.Techivano.com")
    ).toEqual({ slug: "gwarimpa-estate" });
    expect(parseBookingPlusAddress("inbox@pms.techivano.com")).toBeNull();
    expect(
      parseBookingPlusAddress("booking@pms.techivano.com")
    ).toBeNull();
  });
});
