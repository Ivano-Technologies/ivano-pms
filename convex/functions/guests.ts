import { v } from "convex/values";

import type { QueryCtx } from "../_generated/server";
import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";
import type { Id } from "../_generated/dataModel";

const idType = v.union(
  v.literal("passport"),
  v.literal("drivers_license"),
  v.literal("national_id"),
  v.literal("other")
);

const guestDoc = v.object({
  _id: v.id("guest"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  phone: v.string(),
  whatsapp: v.optional(v.string()),
  telegramId: v.optional(v.string()),
  instagramHandle: v.optional(v.string()),
  idType,
  idNumber: v.string(),
  notes: v.optional(v.string()),
  isDeleted: v.boolean(),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
});

const guestWithBookings = v.object({
  ...guestDoc.fields,
  activeBookingCount: v.number()
});

const RESTORE_WINDOW_MS = 30_000;

const ACTIVE_BOOKING_STATUSES = new Set([
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in",
  "checked_out"
]);

async function countActiveBookingsForGuest(
  ctx: QueryCtx,
  propertyId: Id<"property">,
  guestId: Id<"guest">
): Promise<number> {
  const bookings = await ctx.db
    .query("booking")
    .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
    .take(200);

  return bookings.filter(
    (b) => b.guestId === guestId && ACTIVE_BOOKING_STATUSES.has(b.status)
  ).length;
}

export const getGuests = authedQuery({
  args: {},
  returns: v.array(guestDoc),
  handler: async (ctx) => {
    const guests = await ctx.db
      .query("guest")
      .withIndex("by_property", (q) =>
        q.eq("propertyId", ctx.manager.propertyId)
      )
      .take(100);
    return guests.filter((g) => !g.isDeleted);
  }
});

export const getGuestById = authedQuery({
  args: {
    guestId: v.id("guest")
  },
  returns: guestWithBookings,
  handler: async (ctx, args) => {
    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest) {
      throw new Error("Guest not found");
    }

    assertPropertyAccess(ctx.manager, guest.propertyId);

    const activeBookingCount = await countActiveBookingsForGuest(
      ctx,
      guest.propertyId,
      guest._id
    );

    return { ...guest, activeBookingCount };
  }
});

export const createGuest = authedMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    idType: idType,
    idNumber: v.string(),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  returns: v.id("guest"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("guest", {
      propertyId: ctx.manager.propertyId,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim() || undefined,
      whatsapp: args.whatsapp?.trim() || undefined,
      idType: args.idType,
      idNumber: args.idNumber.trim(),
      notes: args.notes?.trim() || undefined,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateGuest = authedMutation({
  args: {
    guestId: v.id("guest"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    idType: idType,
    idNumber: v.string(),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  returns: guestDoc,
  handler: async (ctx, args) => {
    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest || guest.isDeleted) {
      throw new Error("Guest not found");
    }

    assertPropertyAccess(ctx.manager, guest.propertyId);

    const now = Date.now();
    await ctx.db.patch("guest", args.guestId, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      phone: args.phone.trim(),
      email: args.email?.trim() || undefined,
      whatsapp: args.whatsapp?.trim() || undefined,
      idType: args.idType,
      idNumber: args.idNumber.trim(),
      notes: args.notes?.trim() || undefined,
      updatedAt: now
    });

    const updated = await ctx.db.get("guest", args.guestId);
    if (!updated) {
      throw new Error("Guest not found");
    }
    return updated;
  }
});

export const softDeleteGuest = authedMutation({
  args: {
    guestId: v.id("guest")
  },
  returns: guestDoc,
  handler: async (ctx, args) => {
    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest || guest.isDeleted) {
      throw new Error("Guest not found");
    }

    assertPropertyAccess(ctx.manager, guest.propertyId);

    const now = Date.now();
    await ctx.db.patch("guest", args.guestId, {
      isDeleted: true,
      deletedAt: now,
      updatedAt: now
    });

    const updated = await ctx.db.get("guest", args.guestId);
    if (!updated) {
      throw new Error("Guest not found");
    }
    return updated;
  }
});

export const restoreGuest = authedMutation({
  args: {
    guestId: v.id("guest")
  },
  returns: guestDoc,
  handler: async (ctx, args) => {
    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest || !guest.isDeleted) {
      throw new Error("Guest not found or not deleted");
    }

    assertPropertyAccess(ctx.manager, guest.propertyId);

    if (
      guest.deletedAt === undefined ||
      Date.now() - guest.deletedAt > RESTORE_WINDOW_MS
    ) {
      throw new Error("Restore window expired (30 seconds)");
    }

    const now = Date.now();
    await ctx.db.patch("guest", args.guestId, {
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: now
    });

    const updated = await ctx.db.get("guest", args.guestId);
    if (!updated) {
      throw new Error("Guest not found");
    }
    return updated;
  }
});
