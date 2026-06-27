import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { extractMessageKeywords, referenceDateFromTimestamp } from "./nlp";

export type MessageChannel = "whatsapp" | "telegram" | "instagram";
export type MessageDirection = "inbound" | "outbound";

export type ThreadIdentity = {
  telegramChatId?: string;
  telegramUserId?: string;
  senderPhone?: string;
  instagramUserId?: string;
};

export function buildThreadKey(
  channel: MessageChannel,
  ids: ThreadIdentity
): string {
  if (channel === "telegram") {
    if (ids.telegramChatId) {
      return `tg:chat:${ids.telegramChatId}`;
    }
    if (ids.telegramUserId) {
      return `tg:user:${ids.telegramUserId}`;
    }
    throw new Error("Telegram thread requires chat id or user id");
  }

  if (channel === "whatsapp") {
    if (!ids.senderPhone) {
      throw new Error("WhatsApp thread requires sender phone");
    }
    return `wa:${ids.senderPhone}`;
  }

  if (!ids.instagramUserId) {
    throw new Error("Instagram thread requires user id");
  }
  return `ig:${ids.instagramUserId}`;
}

function truncatePreview(text: string, max = 160): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max).trimEnd()}…`;
}

export async function ensureInboxThread(
  ctx: MutationCtx,
  args: {
    propertyId: Id<"property">;
    channel: MessageChannel;
    threadKey: string;
    guestDisplayName: string;
    telegramChatId?: string;
    telegramUserId?: string;
    senderPhone?: string;
    instagramUserId?: string;
    now?: number;
  }
): Promise<Id<"inboxThread">> {
  const now = args.now ?? Date.now();

  const existing = await ctx.db
    .query("inboxThread")
    .withIndex("by_property_thread_key", (q) =>
      q.eq("propertyId", args.propertyId).eq("threadKey", args.threadKey)
    )
    .first();

  if (existing) {
    await ctx.db.patch("inboxThread", existing._id, {
      guestDisplayName: args.guestDisplayName,
      telegramChatId: args.telegramChatId ?? existing.telegramChatId,
      telegramUserId: args.telegramUserId ?? existing.telegramUserId,
      senderPhone: args.senderPhone ?? existing.senderPhone,
      instagramUserId: args.instagramUserId ?? existing.instagramUserId,
      updatedAt: now
    });
    return existing._id;
  }

  return await ctx.db.insert("inboxThread", {
    propertyId: args.propertyId,
    channel: args.channel,
    threadKey: args.threadKey,
    guestDisplayName: args.guestDisplayName,
    telegramChatId: args.telegramChatId,
    telegramUserId: args.telegramUserId,
    senderPhone: args.senderPhone,
    instagramUserId: args.instagramUserId,
    lastMessagePreview: "",
    lastMessageAt: now,
    unreadCount: 0,
    status: "reviewed",
    createdAt: now,
    updatedAt: now
  });
}

type IngestMessageBase = {
  propertyId: Id<"property">;
  channel: MessageChannel;
  senderName: string;
  messageText: string;
  threadKey: string;
  direction: MessageDirection;
  telegramChatId?: string;
  telegramUserId?: string;
  senderPhone?: string;
  instagramUserId?: string;
  managerId?: Id<"manager">;
  status?: "new" | "reviewed";
  now?: number;
};

async function touchInboxThread(
  ctx: MutationCtx,
  threadId: Id<"inboxThread">,
  args: {
    guestDisplayName: string;
    messageText: string;
    direction: MessageDirection;
    now: number;
    inboundIsUnread: boolean;
  }
): Promise<void> {
  const thread = await ctx.db.get("inboxThread", threadId);
  if (!thread) {
    throw new Error("Inbox thread not found");
  }

  const unreadDelta = args.inboundIsUnread && args.direction === "inbound" ? 1 : 0;
  const unreadCount = Math.max(0, thread.unreadCount + unreadDelta);
  const status =
    unreadCount > 0 ? "new" : thread.status === "converted" ? "converted" : "reviewed";

  await ctx.db.patch("inboxThread", threadId, {
    guestDisplayName: args.guestDisplayName,
    lastMessagePreview: truncatePreview(args.messageText),
    lastMessageAt: args.now,
    unreadCount,
    status,
    updatedAt: args.now
  });
}

export async function ingestChannelMessage(
  ctx: MutationCtx,
  args: IngestMessageBase
): Promise<Id<"bookingChannelMessage">> {
  const now = args.now ?? Date.now();
  const direction = args.direction;
  const status =
    args.status ?? (direction === "inbound" ? ("new" as const) : ("reviewed" as const));

  const threadId = await ensureInboxThread(ctx, {
    propertyId: args.propertyId,
    channel: args.channel,
    threadKey: args.threadKey,
    guestDisplayName: args.senderName,
    telegramChatId: args.telegramChatId,
    telegramUserId: args.telegramUserId,
    senderPhone: args.senderPhone,
    instagramUserId: args.instagramUserId,
    now
  });

  const extracted =
    direction === "inbound"
      ? extractMessageKeywords(args.messageText, referenceDateFromTimestamp(now))
      : {};

  const messageId = await ctx.db.insert("bookingChannelMessage", {
    propertyId: args.propertyId,
    channel: args.channel,
    senderName: args.senderName,
    messageText: args.messageText,
    threadKey: args.threadKey,
    direction,
    telegramChatId: args.telegramChatId,
    telegramUserId: args.telegramUserId,
    senderPhone: args.senderPhone,
    instagramUserId: args.instagramUserId,
    managerId: args.managerId,
    ...extracted,
    status,
    createdAt: now,
    updatedAt: now
  });

  await touchInboxThread(ctx, threadId, {
    guestDisplayName: args.senderName,
    messageText: args.messageText,
    direction,
    now,
    inboundIsUnread: status === "new"
  });

  return messageId;
}
