import { describe, expect, it } from "vitest";

import { verifyTelegramWebhookSecret } from "./verify";

describe("verifyTelegramWebhookSecret", () => {
  const secret = "telegram-secret-token";

  it("accepts a matching X-Telegram-Bot-Api-Secret-Token header", () => {
    expect(verifyTelegramWebhookSecret("telegram-secret-token", secret)).toBe(
      true
    );
  });

  it("rejects missing or mismatched headers", () => {
    expect(verifyTelegramWebhookSecret(null, secret)).toBe(false);
    expect(verifyTelegramWebhookSecret("wrong", secret)).toBe(false);
  });
});
