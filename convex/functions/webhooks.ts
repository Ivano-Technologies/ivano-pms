import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { assertInternalJobSecret } from "../lib/secrets";

const messageChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram")
);

const webhookEventType = v.union(v.literal("channel.message"));

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
      return await ctx.db.insert("bookingChannelMessage", {
        propertyId: args.propertyId,
        channel: args.event.channel,
        senderName: args.event.senderName,
        messageText: args.event.messageText,
        senderPhone: args.event.senderPhone,
        telegramUserId: args.event.telegramUserId,
        instagramUserId: args.event.instagramUserId,
        status: "new",
        createdAt: now,
        updatedAt: now
      });
    }

    throw new Error(`Unsupported webhook event type: ${args.event.type}`);
  }
});
