"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import {
  decryptChannelToken,
  encryptChannelToken,
  validateChannelTokenEncryptionKey
} from "../lib/channelTokenCrypto";
import { assertInternalJobSecret } from "../lib/secrets";

const messageChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram")
);

/**
 * Encrypts tokens at rest, then persists via internal mutation.
 * OAuth callbacks and webhook jobs should call this action, not the raw mutation.
 */
export const upsertChannelToken = internalAction({
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
  handler: async (ctx, args): Promise<Id<"channelToken">> => {
    assertInternalJobSecret(args.secret);
    validateChannelTokenEncryptionKey();

    return await ctx.runMutation(
      internal.functions.channelTokens.upsertChannelTokenInternal,
      {
        secret: args.secret,
        propertyId: args.propertyId,
        channel: args.channel,
        accessToken: encryptChannelToken(args.accessToken),
        refreshToken: args.refreshToken
          ? encryptChannelToken(args.refreshToken)
          : undefined,
        expiresAt: args.expiresAt,
        phoneNumberId: args.phoneNumberId
      }
    );
  }
});

/** For outbound API calls (Week 6.5). Never expose via public API. */
export const getDecryptedChannelToken = internalAction({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    channel: messageChannel
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      phoneNumberId: v.optional(v.string())
    }),
    v.null()
  ),
  handler: async (ctx, args): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    phoneNumberId?: string;
  } | null> => {
    assertInternalJobSecret(args.secret);
    validateChannelTokenEncryptionKey();

    const row = await ctx.runQuery(
      internal.functions.channelTokens.getChannelTokenRowInternal,
      {
        secret: args.secret,
        propertyId: args.propertyId,
        channel: args.channel
      }
    ) as {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: number;
      phoneNumberId?: string;
    } | null;

    if (!row) {
      return null;
    }

    return {
      accessToken: decryptChannelToken(row.accessToken),
      refreshToken: row.refreshToken
        ? decryptChannelToken(row.refreshToken)
        : undefined,
      expiresAt: row.expiresAt,
      phoneNumberId: row.phoneNumberId
    };
  }
});
