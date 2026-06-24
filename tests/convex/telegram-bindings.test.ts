import { beforeEach, describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import { api, createTestConvex, seedAuthedManager } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
});

describe("telegram /start property_token resolution", () => {
  it("links a chat to the property matching the connect token", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    const token = await t.mutation(
      internal.functions.telegram.ensureTelegramConnectTokenInternal,
      {
        secret: INTERNAL_SECRET,
        propertyId: seed.propertyId,
        token: "prop_test_token_001"
      }
    );

    expect(token).toBe("prop_test_token_001");

    const property = await t.mutation(
      internal.functions.telegram.linkChatFromStartInternal,
      {
        secret: INTERNAL_SECRET,
        connectToken: "prop_test_token_001",
        telegramChatId: "chat-100",
        telegramUserId: "user-42",
        senderName: "Ada Okonkwo"
      }
    );

    expect(property.propertyId).toBe(seed.propertyId);
    expect(property.propertyName).toBe("Test Property");

    const binding = await t.query(
      internal.functions.telegram.getTelegramChatBindingInternal,
      {
        secret: INTERNAL_SECRET,
        telegramChatId: "chat-100"
      }
    );

    expect(binding?.propertyId).toBe(seed.propertyId);
  });

  it("rejects unknown connect tokens", async () => {
    const t = createTestConvex();
    await seedAuthedManager(t);

    await expect(
      t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
        secret: INTERNAL_SECRET,
        connectToken: "missing-token",
        telegramChatId: "chat-200",
        telegramUserId: "user-99",
        senderName: "Unknown"
      })
    ).rejects.toThrow(/Invalid or expired property link/i);
  });

  it("ingests channel messages for a linked chat", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    await t.mutation(internal.functions.telegram.ensureTelegramConnectTokenInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      token: "prop_ingest_001"
    });

    await t.mutation(internal.functions.telegram.linkChatFromStartInternal, {
      secret: INTERNAL_SECRET,
      connectToken: "prop_ingest_001",
      telegramChatId: "chat-ingest",
      telegramUserId: "user-ingest",
      senderName: "Sarah K"
    });

    const messageId = await t.mutation(
      internal.functions.telegram.ingestTelegramMessageInternal,
      {
        secret: INTERNAL_SECRET,
        telegramChatId: "chat-ingest",
        senderName: "Sarah K",
        messageText: "Need a suite for 2 nights from July 15",
        telegramUserId: "user-ingest"
      }
    );

    expect(messageId).toBeTruthy();

    const messages = await t.mutation(
      api.functions.webhooks.listChannelMessagesForVerification,
      {
        secret: INTERNAL_SECRET,
        propertyId: seed.propertyId,
        messageText: "Need a suite for 2 nights from July 15"
      }
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.channel).toBe("telegram");
    expect(messages[0]?.senderName).toBe("Sarah K");
  });

  it("rejects messages from unlinked chats", async () => {
    const t = createTestConvex();
    await seedAuthedManager(t);

    await expect(
      t.mutation(internal.functions.telegram.ingestTelegramMessageInternal, {
        secret: INTERNAL_SECRET,
        telegramChatId: "chat-unlinked",
        senderName: "Ghost",
        messageText: "Hello",
        telegramUserId: "ghost-1"
      })
    ).rejects.toThrow(/Chat is not linked to a property/i);
  });
});
