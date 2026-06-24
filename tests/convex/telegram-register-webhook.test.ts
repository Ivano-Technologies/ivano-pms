import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../convex/_generated/api";
import { createTestConvex } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

describe("registerTelegramWebhook", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = "bot123:abc";
    process.env.TELEGRAM_WEBHOOK_URL =
      "https://pms.techivano.com/api/webhooks/telegram";
    process.env.TELEGRAM_WEBHOOK_SECRET = "telegram-secret-token";
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("calls Telegram setWebhook with url and secret_token", async () => {
    const t = createTestConvex();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: true, description: "Webhook was set" })
    });

    const result = await t.action(
      internal.functions.telegramWebhookActions.registerTelegramWebhook,
      { secret: INTERNAL_SECRET }
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/botbot123:abc/setWebhook");
    const body = JSON.parse(String(init.body)) as {
      url: string;
      secret_token: string;
      allowed_updates: string[];
    };
    expect(body.url).toBe("https://pms.techivano.com/api/webhooks/telegram");
    expect(body.secret_token).toBe("telegram-secret-token");
    expect(body.allowed_updates).toEqual(["message"]);
  });

  it("surfaces Telegram API errors", async () => {
    const t = createTestConvex();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, description: "Bad Request: invalid webhook URL" })
    });

    await expect(
      t.action(internal.functions.telegramWebhookActions.registerTelegramWebhook, {
        secret: INTERNAL_SECRET
      })
    ).rejects.toThrow(/invalid webhook URL/i);
  });
});
