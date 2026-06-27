import { mutation } from "../_generated/server";
import { v } from "convex/values";

import { buildThreadKey, ingestChannelMessage } from "../lib/inboxIngestion";
import { assertInternalJobSecret } from "../lib/secrets";

const messageChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram")
);

const messageStatus = v.union(
  v.literal("new"),
  v.literal("reviewed"),
  v.literal("converted"),
  v.literal("archived")
);

const webhookEventType = v.union(v.literal("channel.message"));

const channelMessageVerification = v.object({
  _id: v.id("bookingChannelMessage"),
  messageText: v.string(),
  channel: messageChannel,
  senderName: v.string(),
  status: messageStatus,
  extractedCheckIn: v.optional(v.string()),
  extractedCheckOut: v.optional(v.string()),
  extractedGuestNames: v.optional(v.array(v.string())),
  extractedUnitType: v.optional(v.string()),
  createdAt: v.number()
});

export const processWebhookEvent = mutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    event: v.object({
      type: webhookEventType,
      channel: messageChannel,
      senderName: v.string(),
      messageText: v.string(),
      senderPhone: v.optional(v.string()),
      telegramUserId: v.optional(v.string()),
      instagramUserId: v.optional(v.string())
    })
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    const now = Date.now();

    if (args.event.type === "channel.message") {
      const threadKey = buildThreadKey(args.event.channel, {
        senderPhone: args.event.senderPhone,
        telegramUserId: args.event.telegramUserId,
        instagramUserId: args.event.instagramUserId
      });

      return await ingestChannelMessage(ctx, {
        propertyId: args.propertyId,
        channel: args.event.channel,
        senderName: args.event.senderName,
        messageText: args.event.messageText,
        threadKey,
        direction: "inbound",
        senderPhone: args.event.senderPhone,
        telegramUserId: args.event.telegramUserId,
        instagramUserId: args.event.instagramUserId,
        now
      });
    }

    throw new Error(`Unsupported webhook event type: ${args.event.type}`);
  }
});

/** Secret-guarded listing for webhook E2E / smoke scripts (not for dashboard UI). */
export const listChannelMessagesForVerification = mutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    limit: v.optional(v.number()),
    messageText: v.optional(v.string())
  },
  returns: v.array(channelMessageVerification),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const limit = args.limit ?? 50;
    let messages = await ctx.db
      .query("bookingChannelMessage")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .take(200);

    if (args.messageText !== undefined) {
      messages = messages.filter(
        (message) => message.messageText === args.messageText
      );
    }

    return messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((message) => ({
        _id: message._id,
        messageText: message.messageText,
        channel: message.channel,
        senderName: message.senderName,
        status: message.status,
        extractedCheckIn: message.extractedCheckIn,
        extractedCheckOut: message.extractedCheckOut,
        extractedGuestNames: message.extractedGuestNames,
        extractedUnitType: message.extractedUnitType,
        createdAt: message.createdAt
      }));
  }
});
