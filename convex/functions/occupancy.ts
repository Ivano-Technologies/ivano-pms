import { v } from "convex/values";

import { authedQuery } from "../lib/customFunctions";

export const getOccupancySnapshot = authedQuery({
  args: {
    snapshotDate: v.string()
  },
  returns: v.union(
    v.object({
      _id: v.id("occupancySnapshot"),
      _creationTime: v.number(),
      propertyId: v.id("property"),
      snapshotDate: v.string(),
      totalUnits: v.number(),
      occupiedUnits: v.number(),
      occupancyRate: v.number(),
      revenueNgn: v.number(),
      bookingSources: v.object({
        whatsapp: v.number(),
        telegram: v.number(),
        instagram: v.number(),
        direct: v.number()
      }),
      createdAt: v.number()
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;

    return await ctx.db
      .query("occupancySnapshot")
      .withIndex("by_property_date", (q) =>
        q.eq("propertyId", propertyId).eq("snapshotDate", args.snapshotDate)
      )
      .unique();
  }
});
