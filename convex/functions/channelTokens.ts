import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import { authedQuery } from "../lib/customFunctions";
import { assertInternalJobSecret } from "../lib/secrets";

const messageChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram"),
  v.literal("email")
);

const channelTokenDoc = v.object({
  _id: v.id("channelToken"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  channel: messageChannel,
  accessToken: v.string(),
  refreshToken: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  phoneNumberId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number()
});

const channelTokenPublic = v.object({
  channel: messageChannel,
  isConnected: v.boolean(),
  expiresAt: v.optional(v.number()),
  phoneNumberId: v.optional(v.string()),
  updatedAt: v.number()
});

export const getChannelTokens = authedQuery({
  args: {},
  returns: v.array(channelTokenPublic),
  handler: async (ctx) => {
    const propertyId = ctx.manager.propertyId;
    const channels: Array<"whatsapp" | "telegram" | "instagram"> = [
      "whatsapp",
      "telegram",
      "instagram"
    ];

    const tokens = await ctx.db
      .query("channelToken")
      .withIndex("by_property_channel", (q) => q.eq("propertyId", propertyId))
      .take(10);

    return channels.map((channel) => {
      const token = tokens.find((t) => t.channel === channel);
      if (!token) {
        return {
          channel,
          isConnected: false,
          updatedAt: 0
        };
      }
      return {
        channel,
        isConnected: true,
        expiresAt: token.expiresAt,
        phoneNumberId: token.phoneNumberId,
        updatedAt: token.updatedAt
      };
    });
  }
});

export const upsertChannelTokenInternal = internalMutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    channel: messageChannel,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    phoneNumberId: v.optional(v.string())
  },
  returns: v.id("channelToken"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    // accessToken and refreshToken are AES-256-GCM ciphertext (v1: prefix). See channelTokenActions.
    const existing = await ctx.db
      .query("channelToken")
      .withIndex("by_property_channel", (q) =>
        q.eq("propertyId", args.propertyId).eq("channel", args.channel)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch("channelToken", existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        phoneNumberId: args.phoneNumberId,
        updatedAt: now
      });
      return existing._id;
    }

    return await ctx.db.insert("channelToken", {
      propertyId: args.propertyId,
      channel: args.channel,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      phoneNumberId: args.phoneNumberId,
      createdAt: now,
      updatedAt: now
    });
  }
});

export { channelTokenDoc };

export const getChannelTokenRowInternal = internalQuery({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    channel: messageChannel
  },
  returns: v.union(channelTokenDoc, v.null()),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    return await ctx.db
      .query("channelToken")
      .withIndex("by_property_channel", (q) =>
        q.eq("propertyId", args.propertyId).eq("channel", args.channel)
      )
      .first();
  }
});
