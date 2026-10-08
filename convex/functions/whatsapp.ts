import { v } from "convex/values";

import { internal } from "../_generated/api";
import { ingestChannelMessage } from "../lib/inboxIngestion";
import { authedMutation } from "../lib/customFunctions";

export const replyToWhatsAppThread = authedMutation({
  args: {
    threadId: v.id("inboxThread"),
    messageText: v.string()
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args) => {
    const trimmed = args.messageText.trim();
    if (!trimmed) {
      throw new Error("Reply cannot be empty");
    }

    const thread = await ctx.db.get("inboxThread", args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.propertyId !== ctx.manager.propertyId) {
      throw new Error("Unauthorized");
    }
    if (thread.channel !== "whatsapp") {
      throw new Error("Replies on this path are only supported for WhatsApp threads");
    }
    if (!thread.senderPhone) {
      throw new Error("WhatsApp sender phone is not linked");
    }

    const secret = process.env.INTERNAL_JOB_SECRET;
    if (!secret) {
      throw new Error("INTERNAL_JOB_SECRET is not configured");
    }

    const messageId = await ingestChannelMessage(ctx, {
      propertyId: thread.propertyId,
      channel: "whatsapp",
      senderName: ctx.manager.fullName,
      messageText: trimmed,
      threadKey: thread.threadKey,
      direction: "outbound",
      senderPhone: thread.senderPhone,
      managerId: ctx.manager._id,
      status: "reviewed"
    });

    await ctx.scheduler.runAfter(
      0,
      internal.functions.whatsappActions.sendWhatsAppMessageInternal,
      {
        secret,
        propertyId: thread.propertyId,
        toPhone: thread.senderPhone,
        messageText: trimmed
      }
    );

    return messageId;
  }
});
