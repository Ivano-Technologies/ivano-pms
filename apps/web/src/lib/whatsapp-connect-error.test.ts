import { describe, expect, it } from "vitest";

import {
  WHATSAPP_CONNECT_COPY,
  toWhatsAppConnectError,
  whatsAppConnectErrorKind,
  whatsAppConnectRef
} from "./whatsapp-connect-error";

describe("WhatsApp connect error mapping (IVA-189)", () => {
  it.each([
    ["whatsapp_not_configured", "notConfigured"],
    ["access_denied", "connectFailed"],
    ["missing_code", "connectFailed"],
    ["invalid_state", "connectFailed"],
    ["token_exchange_failed", "connectFailed"],
    ["store_failed", "expired"],
    ["token_expired", "expired"],
    ["token_invalid", "expired"],
    ["unauthorized", "other"],
    ["server_error", "other"],
    ["constructor", "other"],
    ["", "other"],
    [null, "other"]
  ] as const)("maps %s to %s", (code, kind) => {
    expect(whatsAppConnectErrorKind(code)).toBe(kind);
  });

  it("uses Coco's exact copy and one action per case", () => {
    expect(toWhatsAppConnectError("whatsapp_not_configured")).toMatchObject({
      message: "WhatsApp isn't set up yet. Ask an admin to set it up.",
      actionLabel: null
    });
    expect(toWhatsAppConnectError("access_denied")).toMatchObject({
      message: "We couldn't connect WhatsApp. Try again.",
      actionLabel: "Try again"
    });
    expect(toWhatsAppConnectError("store_failed")).toMatchObject({
      message: "Your WhatsApp connection has expired. Reconnect to keep sending messages.",
      actionLabel: "Reconnect"
    });
    expect(toWhatsAppConnectError("weird")).toMatchObject({
      message: "Something went wrong connecting WhatsApp. Try again.",
      actionLabel: "Try again"
    });
  });

  it("never mentions env vars, Vercel, Meta, OAuth, codes or tokens", () => {
    for (const { message } of Object.values(WHATSAPP_CONNECT_COPY)) {
      expect(message).not.toMatch(/WHATSAPP_APP|Vercel|Meta|OAuth|authorization|token|[—–]/i);
    }
  });

  it("keeps a valid server ref and replaces anything else with a fresh 8 character ref", () => {
    expect(whatsAppConnectRef("K7QM2XWA")).toBe("K7QM2XWA");
    expect(whatsAppConnectRef("k7qm2xwa")).toBe("K7QM2XWA");
    for (const bad of [null, undefined, "", "short", "<script>alert(1)</script>"]) {
      const ref = whatsAppConnectRef(bad);
      expect(ref).toMatch(/^[A-Z0-9]{8}$/);
      expect(ref).not.toBe(bad);
    }
  });
});
