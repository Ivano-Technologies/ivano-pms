import { beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../convex/_generated/api";
import { api, authedClient, createTestConvex, seedAuthedManager } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
});

describe("Telegram inbox reply (6.1.4)", () => {
  it("records an outbound manager reply on the thread", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await t.mutation(internal.functions.telegram.ensureTelegramConnectTokenInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      token: "reply_token_001"
    });

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: "reply_token_001",
      telegramChatId: "chat-reply-a",
      telegramUserId: "user-reply-a",
      senderName: "Guest One"
    });

    await t.mutation(internal.functions.telegram.ingestTelegramMessageInternal, {
      secret: INTERNAL_SECRET,
      telegramChatId: "chat-reply-a",
      senderName: "Guest One",
      messageText: "Is the villa free next weekend?",
      telegramUserId: "user-reply-a"
    });

    const [thread] = await asManager.query(api.functions.inboxThreads.listInboxThreads, {});
    expect(thread).toBeTruthy();

    const messageId = await asManager.mutation(
      api.functions.telegram.replyToTelegramThread,
      {
        threadId: thread!._id,
        messageText: "Yes, the villa is available. Shall I send a booking link?"
      }
    );

    expect(messageId).toBeTruthy();

    const messages = await asManager.query(api.functions.inboxThreads.getThreadMessages, {
      threadId: thread!._id
    });

    expect(messages).toHaveLength(2);
    const outbound = messages.find((m) => m.direction === "outbound");
    expect(outbound?.messageText).toContain("available");
    expect(outbound?.senderName).toBe("Test Manager");
    expect(outbound?.managerId).toBe(seed.managerId);
  });

  it("rejects reply when thread is not Telegram", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const threadId = await t.run(async (ctx) =>
      ctx.db.insert("inboxThread", {
        propertyId: seed.propertyId,
        channel: "whatsapp",
        threadKey: "wa:+234801",
        guestDisplayName: "WhatsApp Guest",
        senderPhone: "+234801",
        lastMessagePreview: "Hi",
        lastMessageAt: now,
        unreadCount: 1,
        status: "new",
        createdAt: now,
        updatedAt: now
      })
    );

    await expect(
      asManager.mutation(api.functions.telegram.replyToTelegramThread, {
        threadId,
        messageText: "Hello"
      })
    ).rejects.toThrow(/Telegram/i);
  });
});

describe("sendTelegramReplyInternal", () => {
  it("calls Telegram sendMessage API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 1 } })
    });
    vi.stubGlobal("fetch", fetchMock);

    const t = createTestConvex();

    await t.action(internal.functions.telegramReply.sendTelegramReplyInternal, {
      secret: INTERNAL_SECRET,
      telegramChatId: "chat-api-test",
      messageText: "Reply from manager"
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("sendMessage");
    const body = JSON.parse(init.body as string) as {
      chat_id: string;
      text: string;
    };
    expect(body.chat_id).toBe("chat-api-test");
    expect(body.text).toBe("Reply from manager");

    vi.unstubAllGlobals();
  });
});
