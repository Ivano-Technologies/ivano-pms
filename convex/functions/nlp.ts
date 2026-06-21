import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

import { extractMessageKeywords, referenceDateFromTimestamp } from "../lib/nlp";
import { assertInternalJobSecret } from "../lib/secrets";
import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

type NlpCtx = GenericMutationCtx<DataModel>;

export async function backfillMessagesForProperty(
  ctx: NlpCtx,
  propertyId: Id<"property">
): Promise<number> {
  const messages = await ctx.db
    .query("bookingChannelMessage")
    .withIndex("by_property_status_created", (q) => q.eq("propertyId", propertyId))
    .take(200);

  let updated = 0;
  for (const message of messages) {
    const referenceDate = referenceDateFromTimestamp(message.createdAt);
    const extracted = extractMessageKeywords(message.messageText, referenceDate);
    const hasExtraction =
      extracted.extractedCheckIn !== undefined ||
      extracted.extractedCheckOut !== undefined ||
      extracted.extractedGuestNames !== undefined ||
      extracted.extractedUnitType !== undefined;

    if (!hasExtraction) {
      continue;
    }

    await ctx.db.patch("bookingChannelMessage", message._id, {
      ...extracted,
      updatedAt: Date.now()
    });
    updated += 1;
  }

  return updated;
}

export const backfillMessageNlp = internalMutation({
  args: {
    secret: v.string(),
    propertyId: v.optional(v.id("property"))
  },
  returns: v.object({
    updatedCount: v.number()
  }),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    if (args.propertyId) {
      const updatedCount = await backfillMessagesForProperty(ctx, args.propertyId);
      return { updatedCount };
    }

    const properties = await ctx.db.query("property").take(20);
    let updatedCount = 0;
    for (const property of properties) {
      updatedCount += await backfillMessagesForProperty(ctx, property._id);
    }

    return { updatedCount };
  }
});
