import { beforeEach, describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import { api, authedClient, createTestConvex, seedAuthedManager } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
  process.env.TELEGRAM_BOT_USERNAME = "IvanoPMSBot";
});

describe("Telegram connection (property manager)", () => {
  it("returns null until connection is ensured", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const before = await asManager.query(
      api.functions.telegram.getTelegramConnection,
      {}
    );
    expect(before).toBeNull();
  });

  it("ensureTelegramConnection creates deep link for the property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const connection = await asManager.mutation(
      api.functions.telegram.ensureTelegramConnection,
      {}
    );

    expect(connection.deepLink).toBe(
      "https://t.me/IvanoPMSBot?start=" + encodeURIComponent(connection.connectToken)
    );
    expect(connection.botUsername).toBe("IvanoPMSBot");
    expect(connection.linkedChatCount).toBe(0);
  });

  it("regenerateTelegramConnectToken rotates the deep-link token", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const first = await asManager.mutation(
      api.functions.telegram.ensureTelegramConnection,
      {}
    );
    const rotated = await asManager.mutation(
      api.functions.telegram.regenerateTelegramConnectToken,
      {}
    );

    expect(rotated.connectToken).not.toBe(first.connectToken);
    expect(rotated.deepLink).toContain(rotated.connectToken);
    expect(rotated.updatedAt).toBeGreaterThanOrEqual(first.updatedAt);
  });

  it("listTelegramThreads returns linked guest chats", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.telegram.ensureTelegramConnection, {});

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: (
        await asManager.query(api.functions.telegram.getTelegramConnection, {})
      )!.connectToken,
      telegramChatId: "chat-thread-1",
      telegramUserId: "user-1",
      senderName: "Ada Okonkwo"
    });

    const threads = await asManager.query(
      api.functions.telegram.listTelegramThreads,
      {}
    );

    expect(threads).toHaveLength(1);
    expect(threads[0]?.guestDisplayName).toBe("Ada Okonkwo");
    expect(threads[0]?.telegramChatId).toBe("chat-thread-1");
  });
});
