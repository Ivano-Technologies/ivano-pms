import { beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../../convex/_generated/api";
import { api, authedClient, createTestConvex, seedAuthedManager } from "./helpers";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
  process.env.CHANNEL_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("WhatsApp inbox reply", () => {
  it("records an outbound manager reply on a WhatsApp thread", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const threadId = await t.run(async (ctx) => {
      await ctx.db.insert("bookingChannelMessage", {
        propertyId: seed.propertyId,
        channel: "whatsapp",
        senderName: "Ada Okonkwo",
        messageText: "Is the suite free on Friday?",
        threadKey: "wa:+2348011111111",
        direction: "inbound",
        senderPhone: "+2348011111111",
        status: "new",
        createdAt: now,
        updatedAt: now
      });

      return await ctx.db.insert("inboxThread", {
        propertyId: seed.propertyId,
        channel: "whatsapp",
        threadKey: "wa:+2348011111111",
        guestDisplayName: "Ada Okonkwo",
        senderPhone: "+2348011111111",
        lastMessagePreview: "Is the suite free on Friday?",
        lastMessageAt: now,
        unreadCount: 1,
        status: "new",
        createdAt: now,
        updatedAt: now
      });
    });

    const messageId = await asManager.mutation(api.functions.whatsapp.replyToWhatsAppThread, {
      threadId,
      messageText: "Yes — I can hold it until 4pm."
    });

    expect(messageId).toBeTruthy();

    const messages = await asManager.query(api.functions.inboxThreads.getThreadMessages, {
      threadId
    });
    const outbound = messages.find((message) => message.direction === "outbound");
    expect(outbound?.messageText).toContain("hold it");
    expect(outbound?.senderName).toBe("Test Manager");
    expect(outbound?.channel).toBe("whatsapp");
  });

  it("rejects reply when thread is not WhatsApp", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const threadId = await t.run(async (ctx) =>
      ctx.db.insert("inboxThread", {
        propertyId: seed.propertyId,
        channel: "telegram",
        threadKey: "tg:chat:1",
        guestDisplayName: "Telegram Guest",
        telegramChatId: "1",
        lastMessagePreview: "Hi",
        lastMessageAt: now,
        unreadCount: 1,
        status: "new",
        createdAt: now,
        updatedAt: now
      })
    );

    await expect(
      asManager.mutation(api.functions.whatsapp.replyToWhatsAppThread, {
        threadId,
        messageText: "Hello"
      })
    ).rejects.toThrow(/WhatsApp/i);
  });
});

describe("sendWhatsAppMessageInternal", () => {
  it("posts a Graph API text message with the decrypted token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.1" }] })
    });
    vi.stubGlobal("fetch", fetchMock);

    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    await t.action(internal.functions.channelTokenActions.upsertChannelToken, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      channel: "whatsapp",
      accessToken: "wa-access-token",
      phoneNumberId: "10987654321"
    });

    await t.action(internal.functions.whatsappActions.sendWhatsAppMessageInternal, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      toPhone: "+234 801 111 1111",
      messageText: "Your room is confirmed"
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("10987654321/messages");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer wa-access-token"
    );
    const body = JSON.parse(init.body as string) as {
      to: string;
      text: { body: string };
    };
    expect(body.to).toBe("2348011111111");
    expect(body.text.body).toBe("Your room is confirmed");

    vi.unstubAllGlobals();
  });
});

describe("storeWhatsAppOAuthToken", () => {
  it("encrypts and surfaces the WhatsApp connection", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await t.action(api.functions.whatsappActions.storeWhatsAppOAuthToken, {
      secret: INTERNAL_SECRET,
      propertyId: seed.propertyId,
      accessToken: "oauth-access-token",
      phoneNumberId: "pn-1",
      expiresAt: Date.now() + 86_400_000
    });

    const tokens = await asManager.query(api.functions.channelTokens.getChannelTokens, {});
    const whatsapp = tokens.find((row) => row.channel === "whatsapp");
    expect(whatsapp?.isConnected).toBe(true);
    expect(whatsapp?.phoneNumberId).toBe("pn-1");
  });
});
