import { v } from "convex/values";

import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
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

const occupancyStatus = v.union(
  v.literal("empty"),
  v.literal("pending"),
  v.literal("occupied")
);

const unitWithOccupancy = v.object({
  ...unitDoc.fields,
  occupancyStatus
});

const ACTIVE_BOOKING_STATUSES = new Set([
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in",
  "checked_out"
]);

const INACTIVE_AVAILABILITY = new Set(["maintenance", "reserved"]);

async function getActiveBookingForUnit(
  ctx: QueryCtx,
  unitId: Id<"unit">
): Promise<"empty" | "pending" | "occupied"> {
  const bookings = await ctx.db
    .query("booking")
    .withIndex("by_unit", (q) => q.eq("unitId", unitId))
    .take(50);

  const today = new Date().toISOString().slice(0, 10);

  const active = bookings.filter(
    (b) =>
      ACTIVE_BOOKING_STATUSES.has(b.status) &&
      b.checkInDate <= today &&
      (b.checkOutDate === undefined || b.checkOutDate >= today)
  );

  if (active.length === 0) {
    const upcoming = bookings.filter(
      (b) =>
        ACTIVE_BOOKING_STATUSES.has(b.status) && b.checkInDate > today
    );
    return upcoming.length > 0 ? "pending" : "empty";
  }

  return "occupied";
}

export const getUnits = authedQuery({
  args: {
    includeMaintenanceReserved: v.optional(v.boolean())
  },
  returns: v.array(unitDoc),
  handler: async (ctx, args) => {
    const units = await ctx.db
      .query("unit")
      .withIndex("by_property", (q) =>
        q.eq("propertyId", ctx.manager.propertyId)
      )
      .take(100);

    if (args.includeMaintenanceReserved) {
      return units;
    }
    return units.filter((u) => !INACTIVE_AVAILABILITY.has(u.availabilityStatus));
  }
});

export const getUnitById = authedQuery({
  args: {
    unitId: v.id("unit")
  },
  returns: unitWithOccupancy,
  handler: async (ctx, args) => {
    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    assertPropertyAccess(ctx.manager, unit.propertyId);
    const occ = await getActiveBookingForUnit(ctx, unit._id);
    return { ...unit, occupancyStatus: occ };
  }
});

export const createUnit = authedMutation({
  args: {
    unitNumber: v.string(),
    unitType: unitType,
    capacityGuests: v.number(),
    pricePerNightNgn: v.number(),
    amenities: v.optional(v.array(v.string()))
  },
  returns: v.id("unit"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("unit", {
      propertyId: ctx.manager.propertyId,
      unitNumber: args.unitNumber.trim(),
      unitType: args.unitType,
      capacityGuests: args.capacityGuests,
      pricePerNightNgn: args.pricePerNightNgn,
      amenities: args.amenities ?? [],
      availabilityStatus: "available",
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateUnit = authedMutation({
  args: {
    unitId: v.id("unit"),
    unitNumber: v.optional(v.string()),
    unitType: v.optional(unitType),
    capacityGuests: v.optional(v.number()),
    pricePerNightNgn: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    availabilityStatus: v.optional(availabilityStatus)
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    assertPropertyAccess(ctx.manager, unit.propertyId);

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.unitNumber !== undefined) updates.unitNumber = args.unitNumber.trim();
    if (args.unitType !== undefined) updates.unitType = args.unitType;
    if (args.capacityGuests !== undefined) updates.capacityGuests = args.capacityGuests;
    if (args.pricePerNightNgn !== undefined) updates.pricePerNightNgn = args.pricePerNightNgn;
    if (args.amenities !== undefined) updates.amenities = args.amenities;
    if (args.availabilityStatus !== undefined) updates.availabilityStatus = args.availabilityStatus;

    await ctx.db.patch("unit", args.unitId, updates);
    return null;
  }
});

export const setUnitAvailability = authedMutation({
  args: {
    unitId: v.id("unit"),
    availabilityStatus: availabilityStatus
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit) {
      throw new Error("Unit not found");
    }
    assertPropertyAccess(ctx.manager, unit.propertyId);
    await ctx.db.patch("unit", args.unitId, {
      availabilityStatus: args.availabilityStatus,
      updatedAt: Date.now()
    });
    return null;
  }
});
