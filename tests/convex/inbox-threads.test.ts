import { beforeEach, describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import { api, authedClient, createTestConvex, seedAuthedManager } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
});

describe("inbox thread ingestion (6.1.3)", () => {
  it("creates an inbox thread on Telegram /start link and appends inbound messages", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await t.mutation(internal.functions.telegram.ensureTelegramConnectTokenInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      token: "thread_token_001"
    });

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: "thread_token_001",
      telegramChatId: "chat-thread-a",
      telegramUserId: "user-thread-a",
      senderName: "Ada Okonkwo"
    });

    const messageId = await t.mutation(
      internal.functions.telegram.ingestTelegramMessageInternal,
      {
        secret: INTERNAL_SECRET,
        telegramChatId: "chat-thread-a",
        senderName: "Ada Okonkwo",
        messageText: "Need a suite for July 15 to July 17",
        telegramUserId: "user-thread-a"
      }
    );

    expect(messageId).toBeTruthy();

    const threads = await asManager.query(api.functions.inboxThreads.listInboxThreads, {
      status: "new"
    });

    expect(threads).toHaveLength(1);
    expect(threads[0]?.channel).toBe("telegram");
    expect(threads[0]?.guestDisplayName).toBe("Ada Okonkwo");
    expect(threads[0]?.unreadCount).toBe(1);
    expect(threads[0]?.lastMessagePreview).toContain("suite");

    const messages = await asManager.query(
      api.functions.inboxThreads.getThreadMessages,
      { threadId: threads[0]!._id }
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.direction).toBe("inbound");
    expect(messages[0]?.threadKey).toBe("tg:chat:chat-thread-a");
    expect(messages[0]?.messageText).toContain("July 15");
  });

  it("groups multiple inbound messages in the same Telegram thread", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await t.mutation(internal.functions.telegram.ensureTelegramConnectTokenInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      token: "thread_token_002"
    });

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: "thread_token_002",
      telegramChatId: "chat-thread-b",
      telegramUserId: "user-thread-b",
      senderName: "Sarah K"
    });

    await t.mutation(internal.functions.telegram.ingestTelegramMessageInternal, {
      secret: INTERNAL_SECRET,
      telegramChatId: "chat-thread-b",
      senderName: "Sarah K",
      messageText: "First message",
      telegramUserId: "user-thread-b"
    });

    await t.mutation(internal.functions.telegram.ingestTelegramMessageInternal, {
      secret: INTERNAL_SECRET,
      telegramChatId: "chat-thread-b",
      senderName: "Sarah K",
      messageText: "Second message with dates July 20",
      telegramUserId: "user-thread-b"
    });

    const threads = await asManager.query(api.functions.inboxThreads.listInboxThreads, {});
    expect(threads).toHaveLength(1);
    expect(threads[0]?.unreadCount).toBe(2);

    const messages = await asManager.query(
      api.functions.inboxThreads.getThreadMessages,
      { threadId: threads[0]!._id }
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]?.messageText).toContain("Second message");
  });

  it("marks all inbound messages in a thread as reviewed", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await t.mutation(internal.functions.telegram.ensureTelegramConnectTokenInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      token: "thread_token_003"
    });

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: "thread_token_003",
      telegramChatId: "chat-thread-c",
      telegramUserId: "user-thread-c",
      senderName: "Tunde"
    });

    await t.mutation(internal.functions.telegram.ingestTelegramMessageInternal, {
      secret: INTERNAL_SECRET,
      telegramChatId: "chat-thread-c",
      senderName: "Tunde",
      messageText: "Hello",
      telegramUserId: "user-thread-c"
    });

    const [thread] = await asManager.query(api.functions.inboxThreads.listInboxThreads, {
      status: "new"
    });
    expect(thread?.unreadCount).toBe(1);

    await asManager.mutation(api.functions.inboxThreads.markThreadReviewed, {
      threadId: thread!._id
    });

    const reviewed = await asManager.query(api.functions.inboxThreads.listInboxThreads, {
      status: "new"
    });
    expect(reviewed).toHaveLength(0);

    const threadRow = await t.run(async (ctx) => ctx.db.get("inboxThread", thread!._id));
    expect(threadRow?.unreadCount).toBe(0);
    expect(threadRow?.status).toBe("reviewed");
  });
});
