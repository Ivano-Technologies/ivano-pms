import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import { extractMessageKeywords, referenceDateFromTimestamp } from "../lib/nlp";
import { assertInternalJobSecret } from "../lib/secrets";

const linkResult = v.object({
  propertyId: v.id("property"),
  propertyName: v.string()
});

const bindingDoc = v.union(
  v.object({
    propertyId: v.id("property"),
    telegramChatId: v.string(),
    telegramUserId: v.string(),
    linkedAt: v.number(),
    updatedAt: v.number()
  }),
  v.null()
);

export const ensureTelegramConnectTokenInternal = internalMutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    token: v.optional(v.string())
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const property = await ctx.db.get("property", args.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    const existing = await ctx.db
      .query("propertyConnectToken")
      .withIndex("by_property_channel", (q) =>
        q.eq("propertyId", args.propertyId).eq("channel", "telegram")
      )
      .first();

    if (existing) {
      return existing.token;
    }

    const now = Date.now();
    const token = args.token ?? crypto.randomUUID().replace(/-/g, "");
    await ctx.db.insert("propertyConnectToken", {
      propertyId: args.propertyId,
      channel: "telegram",
      token,
      createdAt: now,
      updatedAt: now
    });

    return token;
  }
});

export const linkChatFromStartInternal = internalMutation({
  args: {
    secret: v.string(),
    connectToken: v.string(),
    telegramChatId: v.string(),
    telegramUserId: v.string(),
    senderName: v.string()
  },
  returns: linkResult,
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const connect = await ctx.db
      .query("propertyConnectToken")
      .withIndex("by_channel_token", (q) =>
        q.eq("channel", "telegram").eq("token", args.connectToken)
      )
      .first();

    if (!connect) {
      throw new Error("Invalid or expired property link token");
    }

    const property = await ctx.db.get("property", connect.propertyId);
    if (!property) {
      throw new Error("Invalid or expired property link token");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_chat", (q) => q.eq("telegramChatId", args.telegramChatId))
      .first();

    if (existing) {
      await ctx.db.patch("telegramChatBinding", existing._id, {
        propertyId: connect.propertyId,
        telegramUserId: args.telegramUserId,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("telegramChatBinding", {
        propertyId: connect.propertyId,
        telegramChatId: args.telegramChatId,
        telegramUserId: args.telegramUserId,
        linkedAt: now,
        updatedAt: now
      });
    }

    return {
      propertyId: connect.propertyId,
      propertyName: property.name
    };
  }
});

export const getTelegramChatBindingInternal = internalQuery({
  args: {
    secret: v.string(),
    telegramChatId: v.string()
  },
  returns: bindingDoc,
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const binding = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_chat", (q) => q.eq("telegramChatId", args.telegramChatId))
      .first();

    if (!binding) {
      return null;
    }

    return {
      propertyId: binding.propertyId,
      telegramChatId: binding.telegramChatId,
      telegramUserId: binding.telegramUserId,
      linkedAt: binding.linkedAt,
      updatedAt: binding.updatedAt
    };
  }
});

export const ingestTelegramMessageInternal = internalMutation({
  args: {
    secret: v.string(),
    telegramChatId: v.string(),
    senderName: v.string(),
    messageText: v.string(),
    telegramUserId: v.string()
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const binding = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_chat", (q) => q.eq("telegramChatId", args.telegramChatId))
      .first();

    if (!binding) {
      throw new Error("Chat is not linked to a property");
    }

    const now = Date.now();
    const referenceDate = referenceDateFromTimestamp(now);
    const extracted = extractMessageKeywords(args.messageText, referenceDate);

    return await ctx.db.insert("bookingChannelMessage", {
      propertyId: binding.propertyId,
      channel: "telegram",
      senderName: args.senderName,
      messageText: args.messageText,
      telegramUserId: args.telegramUserId,
      ...extracted,
      status: "new",
      createdAt: now,
      updatedAt: now
    });
  }
});
