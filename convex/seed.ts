import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

import { clearSeedData, insertDemoData } from "./lib/seedData";
import { assertInternalJobSecret } from "./lib/secrets";

export const seedDemoData = internalMutation({
  args: {},
  returns: v.object({
    propertyId: v.id("property"),
    unitCount: v.number(),
    guestCount: v.number(),
    bookingCount: v.number(),
    messageCount: v.number()
  }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("property").first();
    if (existing) {
      throw new Error("Seed data already exists. Clear the deployment first.");
    }

    return await insertDemoData(ctx);
  }
});

export const seedDemoDataV2 = internalMutation({
  args: { secret: v.string() },
  returns: v.object({
    propertyId: v.id("property"),
    unitCount: v.number(),
    guestCount: v.number(),
    bookingCount: v.number(),
    messageCount: v.number()
  }),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const existing = await ctx.db.query("property").first();
    if (existing) {
      throw new Error("Seed data already exists. Run seedReset first.");
    }

    return await insertDemoData(ctx);
  }
});

export const seedReset = internalMutation({
  args: { secret: v.string() },
  returns: v.object({
    propertyId: v.id("property"),
    unitCount: v.number(),
    guestCount: v.number(),
    bookingCount: v.number(),
    messageCount: v.number()
  }),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    await clearSeedData(ctx);
    return await insertDemoData(ctx);
  }
});
