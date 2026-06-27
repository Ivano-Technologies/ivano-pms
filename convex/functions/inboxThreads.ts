import { v } from "convex/values";

import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";

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

const messageDirection = v.union(v.literal("inbound"), v.literal("outbound"));

const inboxThreadDoc = v.object({
  _id: v.id("inboxThread"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  channel: messageChannel,
  threadKey: v.string(),
  guestDisplayName: v.string(),
  telegramChatId: v.optional(v.string()),
  telegramUserId: v.optional(v.string()),
  senderPhone: v.optional(v.string()),
  instagramUserId: v.optional(v.string()),
  lastMessagePreview: v.string(),
  lastMessageAt: v.number(),
  unreadCount: v.number(),
  status: messageStatus,
  bookingId: v.optional(v.id("booking")),
  createdAt: v.number(),
  updatedAt: v.number()
});

const threadMessageDoc = v.object({
  _id: v.id("bookingChannelMessage"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  bookingId: v.optional(v.id("booking")),
  channel: messageChannel,
  threadKey: v.optional(v.string()),
  direction: v.optional(messageDirection),
  telegramChatId: v.optional(v.string()),
  telegramUserId: v.optional(v.string()),
  senderPhone: v.optional(v.string()),
  instagramUserId: v.optional(v.string()),
  senderName: v.string(),
  messageText: v.string(),
  status: messageStatus,
  managerId: v.optional(v.id("manager")),
  extractedCheckIn: v.optional(v.string()),
  extractedCheckOut: v.optional(v.string()),
  extractedGuestNames: v.optional(v.array(v.string())),
  extractedUnitType: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number()
});

export const listInboxThreads = authedQuery({
  args: {
    status: v.optional(messageStatus),
    channel: v.optional(messageChannel),
    limit: v.optional(v.number())
  },
  returns: v.array(inboxThreadDoc),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;
    const limit = args.limit ?? 50;

    let threads = await ctx.db
      .query("inboxThread")
      .withIndex("by_property_last_message", (q) => q.eq("propertyId", propertyId))
      .order("desc")
      .take(200);

    if (args.status !== undefined) {
      threads = threads.filter((thread) => thread.status === args.status);
    }
    if (args.channel !== undefined) {
      threads = threads.filter((thread) => thread.channel === args.channel);
    }

    return threads.slice(0, limit);
  }
});

export const getThreadMessages = authedQuery({
  args: {
    threadId: v.id("inboxThread"),
    limit: v.optional(v.number())
  },
  returns: v.array(threadMessageDoc),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("inboxThread", args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    assertPropertyAccess(ctx.manager, thread.propertyId);

    const limit = args.limit ?? 100;
    const messages = await ctx.db
      .query("bookingChannelMessage")
      .withIndex("by_property_thread_created", (q) =>
        q.eq("propertyId", thread.propertyId).eq("threadKey", thread.threadKey)
      )
      .order("desc")
      .take(limit);

    return messages;
  }
});

export const markThreadReviewed = authedMutation({
  args: { threadId: v.id("inboxThread") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get("inboxThread", args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    assertPropertyAccess(ctx.manager, thread.propertyId);

    const now = Date.now();
    const messages = await ctx.db
      .query("bookingChannelMessage")
      .withIndex("by_property_thread_created", (q) =>
        q.eq("propertyId", thread.propertyId).eq("threadKey", thread.threadKey)
      )
      .take(200);

    for (const message of messages) {
      if (message.status === "new" && message.direction !== "outbound") {
        await ctx.db.patch("bookingChannelMessage", message._id, {
          status: "reviewed",
          updatedAt: now
        });
      }
    }

    await ctx.db.patch("inboxThread", args.threadId, {
      unreadCount: 0,
      status: thread.status === "converted" ? "converted" : "reviewed",
      updatedAt: now
    });

    return null;
  }
});
