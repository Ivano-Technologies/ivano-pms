import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import { extractMessageKeywords, referenceDateFromTimestamp } from "../lib/nlp";
import { assertInternalJobSecret } from "../lib/secrets";
import {
  buildTelegramDeepLink,
  getTelegramBotUsername
} from "../lib/telegram";
import { authedMutation, authedQuery } from "../lib/customFunctions";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const linkResult = v.object({
  propertyId: v.id("property"),
  propertyName: v.string()
});

const bindingDoc = v.union(
  v.object({
    propertyId: v.id("property"),
    telegramChatId: v.string(),
    telegramUserId: v.string(),
    guestDisplayName: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    linkedAt: v.number(),
    updatedAt: v.number()
  }),
  v.null()
);

const telegramThread = v.object({
  telegramChatId: v.string(),
  telegramUserId: v.string(),
  guestDisplayName: v.optional(v.string()),
  lastMessageAt: v.optional(v.number()),
  linkedAt: v.number()
});

const telegramConnection = v.object({
  deepLink: v.string(),
  connectToken: v.string(),
  linkedChatCount: v.number(),
  botUsername: v.string(),
  createdAt: v.number(),
  updatedAt: v.number()
});

async function ensurePropertyConnectToken(
  ctx: MutationCtx,
  propertyId: Id<"property">,
  token?: string
): Promise<string> {
  const property = await ctx.db.get("property", propertyId);
  if (!property) {
    throw new Error("Property not found");
  }

  const existing = await ctx.db
    .query("propertyConnectToken")
    .withIndex("by_property_channel", (q) =>
      q.eq("propertyId", propertyId).eq("channel", "telegram")
    )
    .first();

  if (existing) {
    return existing.token;
  }

  const now = Date.now();
  const connectToken = token ?? crypto.randomUUID().replace(/-/g, "");
  await ctx.db.insert("propertyConnectToken", {
    propertyId,
    channel: "telegram",
    token: connectToken,
    createdAt: now,
    updatedAt: now
  });

  return connectToken;
}

export const ensureTelegramConnectTokenInternal = internalMutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    token: v.optional(v.string())
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    return await ensurePropertyConnectToken(ctx, args.propertyId, args.token);
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
        guestDisplayName: args.senderName,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("telegramChatBinding", {
        propertyId: connect.propertyId,
        telegramChatId: args.telegramChatId,
        telegramUserId: args.telegramUserId,
        guestDisplayName: args.senderName,
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
      guestDisplayName: binding.guestDisplayName,
      lastMessageAt: binding.lastMessageAt,
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

    await ctx.db.patch("telegramChatBinding", binding._id, {
      guestDisplayName: args.senderName,
      lastMessageAt: now,
      updatedAt: now
    });

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

async function getConnectTokenRow(
  ctx: QueryCtx | MutationCtx,
  propertyId: Id<"property">
) {
  return await ctx.db
    .query("propertyConnectToken")
    .withIndex("by_property_channel", (q) =>
      q.eq("propertyId", propertyId).eq("channel", "telegram")
    )
    .first();
}

export const getTelegramConnection = authedQuery({
  args: {},
  returns: v.union(telegramConnection, v.null()),
  handler: async (ctx) => {
    const propertyId = ctx.manager.propertyId;
    const row = await getConnectTokenRow(ctx, propertyId);
    if (!row) {
      return null;
    }

    const botUsername = getTelegramBotUsername();
    const threads = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .collect();

    return {
      deepLink: buildTelegramDeepLink(botUsername, row.token),
      connectToken: row.token,
      linkedChatCount: threads.length,
      botUsername,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
});

export const ensureTelegramConnection = authedMutation({
  args: {},
  returns: telegramConnection,
  handler: async (ctx) => {
    const propertyId = ctx.manager.propertyId;
    const botUsername = getTelegramBotUsername();
    await ensurePropertyConnectToken(ctx, propertyId);

    const row = await getConnectTokenRow(ctx, propertyId);
    if (!row) {
      throw new Error("Failed to create Telegram connection token");
    }

    const threads = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .collect();

    return {
      deepLink: buildTelegramDeepLink(botUsername, row.token),
      connectToken: row.token,
      linkedChatCount: threads.length,
      botUsername,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
});

export const listTelegramThreads = authedQuery({
  args: {},
  returns: v.array(telegramThread),
  handler: async (ctx) => {
    const propertyId = ctx.manager.propertyId;
    const threads = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .collect();

    return threads
      .map((thread) => ({
        telegramChatId: thread.telegramChatId,
        telegramUserId: thread.telegramUserId,
        guestDisplayName: thread.guestDisplayName,
        lastMessageAt: thread.lastMessageAt,
        linkedAt: thread.linkedAt
      }))
      .sort((a, b) => (b.lastMessageAt ?? b.linkedAt) - (a.lastMessageAt ?? a.linkedAt));
  }
});

export const regenerateTelegramConnectToken = authedMutation({
  args: {},
  returns: telegramConnection,
  handler: async (ctx) => {
    const propertyId = ctx.manager.propertyId;
    const botUsername = getTelegramBotUsername();
    const now = Date.now();
    const newToken = crypto.randomUUID().replace(/-/g, "");

    const existing = await getConnectTokenRow(ctx, propertyId);
    if (existing) {
      await ctx.db.patch("propertyConnectToken", existing._id, {
        token: newToken,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("propertyConnectToken", {
        propertyId,
        channel: "telegram",
        token: newToken,
        createdAt: now,
        updatedAt: now
      });
    }

    const threads = await ctx.db
      .query("telegramChatBinding")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .collect();

    const row = await getConnectTokenRow(ctx, propertyId);
    if (!row) {
      throw new Error("Failed to regenerate Telegram connection token");
    }

    return {
      deepLink: buildTelegramDeepLink(botUsername, row.token),
      connectToken: row.token,
      linkedChatCount: threads.length,
      botUsername,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
});
