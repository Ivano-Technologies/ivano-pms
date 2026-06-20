import { v } from "convex/values";

import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";

const unitType = v.union(
  v.literal("room"),
  v.literal("suite"),
  v.literal("villa"),
  v.literal("studio")
);

const availabilityStatus = v.union(
  v.literal("available"),
  v.literal("occupied"),
  v.literal("maintenance"),
  v.literal("reserved")
);

const unitDoc = v.object({
  _id: v.id("unit"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  unitNumber: v.string(),
  unitType,
  capacityGuests: v.number(),
  pricePerNightNgn: v.number(),
  amenities: v.array(v.string()),
  availabilityStatus,
  createdAt: v.number(),
  updatedAt: v.number()
});

export const getUnits = authedQuery({
  args: {},
  returns: v.array(unitDoc),
  handler: async (ctx) => {
    return await ctx.db
      .query("unit")
      .withIndex("by_property", (q) =>
        q.eq("propertyId", ctx.manager.propertyId)
      )
      .take(100);
  }
});

export const updateUnit = authedMutation({
  args: {
    unitId: v.id("unit"),
    pricePerNightNgn: v.optional(v.number()),
    availabilityStatus: v.optional(availabilityStatus),
    amenities: v.optional(v.array(v.string()))
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }

    assertPropertyAccess(ctx.manager, unit.propertyId);

    const updates: {
      pricePerNightNgn?: number;
      availabilityStatus?: "available" | "occupied" | "maintenance" | "reserved";
      amenities?: string[];
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.pricePerNightNgn !== undefined) {
      updates.pricePerNightNgn = args.pricePerNightNgn;
    }
    if (args.availabilityStatus !== undefined) {
      updates.availabilityStatus = args.availabilityStatus;
    }
    if (args.amenities !== undefined) {
      updates.amenities = args.amenities;
    }

    await ctx.db.patch("unit", args.unitId, updates);
    return null;
  }
});
