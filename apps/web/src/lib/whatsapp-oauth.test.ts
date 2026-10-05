import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildWhatsAppAuthorizeUrl,
  completeWhatsAppOAuth,
  createOAuthNonce,
  getWhatsAppOAuthConfig,
  signWhatsAppOAuthState,
  verifyWhatsAppOAuthState
} from "./whatsapp-oauth";

const CONFIG = {
  appId: "app-123",
  appSecret: "secret-abc",
  redirectUri: "https://pms.techivano.com/api/oauth/whatsapp/callback",
  stateSecret: "state-secret"
};

afterEach(() => {
  delete process.env.WHATSAPP_APP_ID;
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_OAUTH_REDIRECT_URI;
  delete process.env.INTERNAL_JOB_SECRET;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
});

describe("whatsapp oauth state", () => {
  it("round-trips a signed property + CSRF nonce", () => {
    const nonce = createOAuthNonce();
    const state = signWhatsAppOAuthState(
      { propertyId: "property1234567890", nonce, exp: Date.now() + 60_000 },
      CONFIG.stateSecret
    );

    const parsed = verifyWhatsAppOAuthState(state, CONFIG.stateSecret);
    expect(parsed.propertyId).toBe("property1234567890");
    expect(parsed.nonce).toBe(nonce);
  });

  it("rejects tampered or expired state", () => {
    const state = signWhatsAppOAuthState(
      { propertyId: "property1234567890", nonce: "abc", exp: Date.now() + 60_000 },
      CONFIG.stateSecret
    );

    expect(() => verifyWhatsAppOAuthState(`${state}x`, CONFIG.stateSecret)).toThrow(
      /invalid_state/
    );
    expect(() =>
      verifyWhatsAppOAuthState(
        signWhatsAppOAuthState(
          { propertyId: "property1234567890", nonce: "abc", exp: Date.now() - 1 },
          CONFIG.stateSecret
        ),
        CONFIG.stateSecret
      )
    ).toThrow(/invalid_state/);
  });

  it("builds a Meta OAuth authorize URL with CSRF state", () => {
    const url = buildWhatsAppAuthorizeUrl(CONFIG, "signed-state");
    expect(url).toContain("facebook.com");
    expect(url).toContain("client_id=app-123");
    expect(url).toContain("state=signed-state");
    expect(url).toContain("whatsapp_business_messaging");
  });

  it("returns null config when Meta app credentials are missing", () => {
    expect(getWhatsAppOAuthConfig()).toBeNull();
  });

  it("reads config from existing env names only", () => {
    process.env.WHATSAPP_APP_ID = "app-123";
    process.env.WHATSAPP_APP_SECRET = "secret-abc";
    process.env.INTERNAL_JOB_SECRET = "job-secret";
    process.env.WHATSAPP_OAUTH_REDIRECT_URI =
      "https://pms.techivano.com/api/oauth/whatsapp/callback";

    expect(getWhatsAppOAuthConfig()).toEqual({
      appId: "app-123",
      appSecret: "secret-abc",
      redirectUri: "https://pms.techivano.com/api/oauth/whatsapp/callback",
      stateSecret: "job-secret"
    });
  });
});

describe("completeWhatsAppOAuth", () => {
  it("exchanges the code, upgrades the token, and resolves a phone number id", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/oauth/access_token") && url.includes("code=")) {
        return {
          ok: true,
          json: async () => ({ access_token: "short-token", expires_in: 3600 })
        };
      }
      if (url.includes("fb_exchange_token")) {
        return {
          ok: true,
          json: async () => ({ access_token: "long-token", expires_in: 5184000 })
        };
      }
      if (url.includes("/me?") && url.includes("fields=id")) {
        return { ok: true, json: async () => ({ id: "user-1" }) };
      }
      if (url.includes("/me/businesses")) {
        return { ok: true, json: async () => ({ data: [{ id: "biz-1" }] }) };
      }
      if (url.includes("owned_whatsapp_business_accounts")) {
        return { ok: true, json: async () => ({ data: [{ id: "waba-1" }] }) };
      }
      if (url.includes("/phone_numbers")) {
        return { ok: true, json: async () => ({ data: [{ id: "phone-99" }] }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const result = await completeWhatsAppOAuth("auth-code", CONFIG, fetchImpl as typeof fetch);
    expect(result.accessToken).toBe("long-token");
    expect(result.phoneNumberId).toBe("phone-99");
    expect(result.expiresAt).toBeGreaterThan(Date.now());
  });
});
