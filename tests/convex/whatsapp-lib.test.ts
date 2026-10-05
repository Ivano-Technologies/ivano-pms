import { describe, expect, it } from "vitest";

import {
  buildWhatsAppMessagesUrl,
  normalizeWhatsAppPhone
} from "../../convex/lib/whatsapp";

describe("whatsapp helpers", () => {
  it("strips formatting from guest phone numbers", () => {
    expect(normalizeWhatsAppPhone("+234 801-111-1111")).toBe("2348011111111");
  });

  it("rejects empty phone numbers", () => {
    expect(() => normalizeWhatsAppPhone("   ")).toThrow(/phone/i);
  });

  it("builds the Graph messages URL", () => {
    expect(buildWhatsAppMessagesUrl("10987654321")).toBe(
      "https://graph.facebook.com/v21.0/10987654321/messages"
    );
  });
});
