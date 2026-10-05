"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalAction } from "../_generated/server";
import { assertInternalJobSecret } from "../lib/secrets";
import {
  buildWhatsAppMessagesUrl,
  normalizeWhatsAppPhone
} from "../lib/whatsapp";

/**
 * OAuth callback (Next.js) stores the Meta token encrypted via upsertChannelToken.
 * Gated by INTERNAL_JOB_SECRET — never call from the browser.
 */
export const storeWhatsAppOAuthToken = action({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    accessToken: v.string(),
    expiresAt: v.optional(v.number()),
    phoneNumberId: v.optional(v.string())
  },
  returns: v.id("channelToken"),
  handler: async (ctx, args): Promise<Id<"channelToken">> => {
    assertInternalJobSecret(args.secret);

    return await ctx.runAction(internal.functions.channelTokenActions.upsertChannelToken, {
      secret: args.secret,
      propertyId: args.propertyId,
      channel: "whatsapp",
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
      phoneNumberId: args.phoneNumberId
    });
  }
});

export const sendWhatsAppMessageInternal = internalAction({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    toPhone: v.string(),
    messageText: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const token = await ctx.runAction(
      internal.functions.channelTokenActions.getDecryptedChannelToken,
      {
        secret: args.secret,
        propertyId: args.propertyId,
        channel: "whatsapp"
      }
    );

    if (!token) {
      throw new Error("WhatsApp is not connected for this property");
    }
    if (!token.phoneNumberId) {
      throw new Error("WhatsApp phone number ID is missing. Reconnect WhatsApp in Settings.");
    }

    const response = await fetch(buildWhatsAppMessagesUrl(token.phoneNumberId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizeWhatsAppPhone(args.toPhone),
        type: "text",
        text: { body: args.messageText }
      })
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      messages?: Array<{ id?: string }>;
    };

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "WhatsApp send message failed");
    }

    return null;
  }
});
