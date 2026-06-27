import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import {
  displayNameFromEmail,
  formatEmailMessageBody,
  formatInboundEmailAddress,
  parseBookingPlusAddress
} from "../lib/emailRouting";
import { buildThreadKey, ingestChannelMessage } from "../lib/inboxIngestion";
import { assertInternalJobSecret } from "../lib/secrets";
import { authedQuery } from "../lib/customFunctions";

const emailConnection = v.object({
  slug: v.string(),
  inboundAddress: v.string()
});

export const getEmailInboundConnection = authedQuery({
  args: {},
  returns: emailConnection,
  handler: async (ctx) => {
    const property = await ctx.db.get("property", ctx.manager.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    return {
      slug: property.slug,
      inboundAddress: formatInboundEmailAddress(property.slug)
    };
  }
});

export const ingestInboundEmailInternal = internalMutation({
  args: {
    secret: v.string(),
    toAddress: v.string(),
    fromAddress: v.string(),
    fromName: v.optional(v.string()),
    subject: v.string(),
    textBody: v.string()
  },
  returns: v.id("bookingChannelMessage"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const route = parseBookingPlusAddress(args.toAddress);
    if (!route) {
      throw new Error("Invalid inbound email address");
    }

    const property = await ctx.db
      .query("property")
      .withIndex("by_slug", (q) => q.eq("slug", route.slug))
      .first();

    if (!property) {
      throw new Error(`Property not found for slug: ${route.slug}`);
    }

    const fromAddress = args.fromAddress.trim().toLowerCase();
    if (!fromAddress || !fromAddress.includes("@")) {
      throw new Error("Invalid sender email address");
    }

    const senderName = displayNameFromEmail(args.fromName, fromAddress);
    const messageText = formatEmailMessageBody(args.subject, args.textBody);
    const threadKey = buildThreadKey("email", {
      propertyId: property._id,
      senderEmail: fromAddress
    });

    return await ingestChannelMessage(ctx, {
      propertyId: property._id,
      channel: "email",
      senderName,
      messageText,
      threadKey,
      direction: "inbound",
      senderEmail: fromAddress,
      emailSubject: args.subject.trim() || "(no subject)",
      status: "new"
    });
  }
});
