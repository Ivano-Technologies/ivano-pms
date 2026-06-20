import { describe, expect, it } from "vitest";

import { isWebhookEvent } from "./types";
import {
  checkRateLimit,
  resetRateLimitStore,
  signWebhookBody,
  verifyWebhookSignature,
  RATE_LIMIT_MAX
} from "./verify";

describe("verifyWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const body = JSON.stringify({ type: "channel.message", channel: "whatsapp" });

  it("accepts a valid HMAC-SHA256 signature", () => {
    const signature = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(signature, body, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyWebhookSignature("deadbeef", body, secret)).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    resetRateLimitStore();
    const key = "test-key";
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit(key).ok).toBe(true);
    }
  });

  it("returns 429 metadata when limit exceeded", () => {
    resetRateLimitStore();
    const key = "overflow-key";
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.ok).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});

describe("isWebhookEvent", () => {
  it("validates channel.message payloads", () => {
    expect(
      isWebhookEvent({
        type: "channel.message",
        channel: "telegram",
        senderName: "Ada",
        messageText: "Need a suite"
      })
    ).toBe(true);
    expect(isWebhookEvent({ type: "unknown" })).toBe(false);
  });
});
