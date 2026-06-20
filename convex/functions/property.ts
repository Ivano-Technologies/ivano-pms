import { v } from "convex/values";

import { authedQuery } from "../lib/customFunctions";

export const getProperty = authedQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("property"),
      _creationTime: v.number(),
      name: v.string(),
      address: v.string(),
      phone: v.string(),
      whatsapp: v.string(),
      currencyCode: v.literal("NGN"),
      timezone: v.string(),
      createdAt: v.number(),
      updatedAt: v.number()
    }),
    v.null()
  ),
  handler: async (ctx) => {
    return await ctx.db.get("property", ctx.manager.propertyId);
  }
});
