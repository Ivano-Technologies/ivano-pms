import { mutation } from "../_generated/server";
import { v } from "convex/values";

import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";
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

const channelMessageDoc = v.object({
  _id: v.id("bookingChannelMessage"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  bookingId: v.optional(v.id("booking")),
  channel: messageChannel,
  senderPhone: v.optional(v.string()),
  telegramUserId: v.optional(v.string()),
  instagramUserId: v.optional(v.string()),
  senderName: v.string(),
  messageText: v.string(),
  extractedCheckIn: v.optional(v.string()),
  extractedCheckOut: v.optional(v.string()),
  extractedGuestNames: v.optional(v.array(v.string())),
  extractedUnitType: v.optional(v.string()),
  status: messageStatus,
  managerId: v.optional(v.id("manager")),
  createdAt: v.number(),
  updatedAt: v.number()
});

export const getChannelMessages = authedQuery({
  args: {
    status: v.optional(messageStatus),
    channel: v.optional(messageChannel),
    limit: v.optional(v.number())
  },
  returns: v.array(channelMessageDoc),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;
    const limit = args.limit ?? 100;

    let messages = await ctx.db
      .query("bookingChannelMessage")
      .withIndex("by_property_status_created", (q) =>
        q.eq("propertyId", propertyId)
      )
      .take(100);

    if (args.status !== undefined) {
      messages = messages.filter((m) => m.status === args.status);
    }
    if (args.channel !== undefined) {
      messages = messages.filter((m) => m.channel === args.channel);
    }

    return messages.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
});

export const createChannelMessage = mutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    channel: messageChannel,
    senderName: v.string(),
    messageText: v.string(),
    senderPhone: v.optional(v.string()),
    telegramUserId: v.optional(v.string()),
    instagramUserId: v.optional(v.string())
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    const now = Date.now();
    return await ctx.db.insert("bookingChannelMessage", {
      propertyId: args.propertyId,
      channel: args.channel,
      senderName: args.senderName,
      messageText: args.messageText,
      senderPhone: args.senderPhone,
      telegramUserId: args.telegramUserId,
      instagramUserId: args.instagramUserId,
      status: "new",
      createdAt: now,
      updatedAt: now
    });
  }
});

export const markMessageReviewed = authedMutation({
  args: { messageId: v.id("bookingChannelMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("bookingChannelMessage", args.messageId);
    if (!message) throw new Error("Message not found");
    assertPropertyAccess(ctx.manager, message.propertyId);
    await ctx.db.patch("bookingChannelMessage", args.messageId, {
      status: "reviewed",
      updatedAt: Date.now()
    });
    return null;
  }
});

export const markMessageNew = authedMutation({
  args: { messageId: v.id("bookingChannelMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("bookingChannelMessage", args.messageId);
    if (!message) throw new Error("Message not found");
    assertPropertyAccess(ctx.manager, message.propertyId);
    await ctx.db.patch("bookingChannelMessage", args.messageId, {
      status: "new",
      updatedAt: Date.now()
    });
    return null;
  }
});

export const archiveMessage = authedMutation({
  args: { messageId: v.id("bookingChannelMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("bookingChannelMessage", args.messageId);
    if (!message) throw new Error("Message not found");
    assertPropertyAccess(ctx.manager, message.propertyId);
    await ctx.db.patch("bookingChannelMessage", args.messageId, {
      status: "archived",
      updatedAt: Date.now()
    });
    return null;
  }
});

export const unarchiveMessage = authedMutation({
  args: { messageId: v.id("bookingChannelMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("bookingChannelMessage", args.messageId);
    if (!message) throw new Error("Message not found");
    assertPropertyAccess(ctx.manager, message.propertyId);
    await ctx.db.patch("bookingChannelMessage", args.messageId, {
      status: "reviewed",
      updatedAt: Date.now()
    });
    return null;
  }
});

export const convertChannelMessageToBooking = authedMutation({
  args: {
    messageId: v.id("bookingChannelMessage"),
    guestId: v.id("guest"),
    unitId: v.id("unit"),
    checkInDate: v.string(),
    checkOutDate: v.optional(v.string()),
    bookingType: v.union(
      v.literal("nightly"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("lease")
    ),
    totalPriceNgn: v.number()
  },
  returns: v.id("booking"),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("bookingChannelMessage", args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    assertPropertyAccess(ctx.manager, message.propertyId);

    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit || unit.propertyId !== message.propertyId) {
      throw new Error("Unit not found");
    }

    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest || guest.propertyId !== message.propertyId) {
      throw new Error("Guest not found");
    }

    const now = Date.now();
    const bookingId = await ctx.db.insert("booking", {
      propertyId: message.propertyId,
      guestId: args.guestId,
      unitId: args.unitId,
      bookingType: args.bookingType,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      adultsCount: 1,
      childrenCount: 0,
      status: "pending_confirmation",
      sourceChannel: message.channel,
      totalPriceNgn: args.totalPriceNgn,
      paidNgn: 0,
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.patch("bookingChannelMessage", args.messageId, {
      bookingId,
      status: "converted",
      managerId: ctx.manager._id,
      updatedAt: now
    });

    return bookingId;
  }
});
