import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

export const processInboundEmail = action({
  args: {
    secret: v.string(),
    toAddress: v.string(),
    fromAddress: v.string(),
    fromName: v.optional(v.string()),
    subject: v.string(),
    textBody: v.string()
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args): Promise<Id<"bookingChannelMessage">> => {
    return await ctx.runMutation(
      internal.functions.email.ingestInboundEmailInternal,
      args
    );
  }
});
