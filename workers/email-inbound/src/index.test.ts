import { describe, expect, it } from "vitest";

import { buildForwardPayload } from "./payload";

describe("email inbound worker payload (6.2.1)", () => {
  it("normalizes postal-mime message for PMS webhook", () => {
    const message = {
      to: [{ name: "Inbox", address: "booking+gwarimpa-estate@pms.techivano.com" }],
      from: { name: "Ada Guest", address: "guest@example.com" },
      subject: "Booking inquiry",
      text: "Do you have a room for July 10?",
      headers: new Headers()
    };

    expect(buildForwardPayload(message)).toEqual({
      toAddress: "booking+gwarimpa-estate@pms.techivano.com",
      fromAddress: "guest@example.com",
      fromName: "Ada Guest",
      subject: "Booking inquiry",
      textBody: "Do you have a room for July 10?"
    });
  });

  it("returns null when required addresses are missing", () => {
    const message = {
      to: [],
      from: undefined,
      subject: "Hi",
      text: "Hello",
      headers: new Headers()
    };

    expect(buildForwardPayload(message)).toBeNull();
  });
});
