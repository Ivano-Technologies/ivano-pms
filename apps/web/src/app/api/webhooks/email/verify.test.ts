import { describe, expect, it } from "vitest";

import {
  EMAIL_WEBHOOK_SECRET_HEADER,
  verifyEmailWebhookSecret
} from "./verify";

describe("email webhook secret verification (6.2.1)", () => {
  const secret = "email-webhook-secret";

  it("accepts matching secret header", () => {
    expect(verifyEmailWebhookSecret("email-webhook-secret", secret)).toBe(true);
  });

  it("rejects missing or mismatched header", () => {
    expect(verifyEmailWebhookSecret(null, secret)).toBe(false);
    expect(verifyEmailWebhookSecret("wrong", secret)).toBe(false);
  });

  it("exports stable header name", () => {
    expect(EMAIL_WEBHOOK_SECRET_HEADER).toBe("x-email-webhook-secret");
  });
});
