import { v } from "convex/values";

import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";

const bookingType = v.union(
  v.literal("nightly"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("lease")
);

const bookingStatus = v.union(
  v.literal("inquiry"),
  v.literal("pending_confirmation"),
  v.literal("confirmed"),
  v.literal("checked_in"),
  v.literal("checked_out"),
  v.literal("completed"),
  v.literal("cancelled")
);

const sourceChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram"),
  v.literal("direct"),
  v.literal("phone"),
  v.literal("walk_in")
);

const bookingDoc = v.object({
  _id: v.id("booking"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  guestId: v.id("guest"),
  unitId: v.id("unit"),
  bookingType,
  checkInDate: v.string(),
  checkOutDate: v.optional(v.string()),
  adultsCount: v.number(),
  childrenCount: v.number(),
  status: bookingStatus,
  sourceChannel,
  notes: v.optional(v.string()),
  totalPriceNgn: v.number(),
  paidNgn: v.number(),
  createdAt: v.number(),
  updatedAt: v.number()
});

export const getBookingsByDateRange = authedQuery({
  args: {
    startDate: v.string(),
    endDate: v.string()
  },
  returns: v.array(bookingDoc),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(100);

    const overlapping = bookings.filter((booking) => {
      const checkout = booking.checkOutDate ?? args.endDate;
      return booking.checkInDate <= args.endDate && checkout > args.startDate;
    });

    return overlapping.sort((a, b) =>
      a.checkInDate.localeCompare(b.checkInDate)
    );
  }
});

export const getBookings = authedQuery({
  args: {
    status: v.optional(bookingStatus),
    sourceChannel: v.optional(sourceChannel)
  },
  returns: v.array(bookingDoc),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;

    let bookings = await ctx.db
      .query("booking")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(100);

    if (args.status !== undefined) {
      bookings = bookings.filter((b) => b.status === args.status);
    }
    if (args.sourceChannel !== undefined) {
      bookings = bookings.filter((b) => b.sourceChannel === args.sourceChannel);
    }

    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const createBooking = authedMutation({
  args: {
    guestId: v.id("guest"),
    unitId: v.id("unit"),
    checkInDate: v.string(),
    checkOutDate: v.optional(v.string()),
    bookingType: bookingType,
    sourceChannel: sourceChannel,
    adultsCount: v.optional(v.number()),
    childrenCount: v.optional(v.number()),
    totalPriceNgn: v.number(),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("inquiry"),
        v.literal("pending_confirmation"),
        v.literal("confirmed")
      )
    )
  },
  returns: v.id("booking"),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;

    const guest = await ctx.db.get("guest", args.guestId);
    if (!guest || guest.propertyId !== propertyId) {
      throw new Error("Guest not found");
    }

    const unit = await ctx.db.get("unit", args.unitId);
    if (!unit || unit.propertyId !== propertyId) {
      throw new Error("Unit not found");
    }

    const now = Date.now();
    return await ctx.db.insert("booking", {
      propertyId,
      guestId: args.guestId,
      unitId: args.unitId,
      bookingType: args.bookingType,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      adultsCount: args.adultsCount ?? 1,
      childrenCount: args.childrenCount ?? 0,
      status: args.status ?? "inquiry",
      sourceChannel: args.sourceChannel,
      notes: args.notes,
      totalPriceNgn: args.totalPriceNgn,
      paidNgn: 0,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateBookingStatus = authedMutation({
  args: {
    bookingId: v.id("booking"),
    newStatus: bookingStatus
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    const now = Date.now();
    await ctx.db.patch("booking", args.bookingId, {
      status: args.newStatus,
      updatedAt: now
    });

    if (args.newStatus === "checked_in" || args.newStatus === "checked_out") {
      const taskType =
        args.newStatus === "checked_in" ? "guest_checkin" : "guest_checkout";
      await ctx.db.insert("checklist", {
        propertyId: booking.propertyId,
        bookingId: args.bookingId,
        unitId: booking.unitId,
        taskType,
        taskDescription:
          args.newStatus === "checked_in"
            ? "Complete guest check-in"
            : "Complete guest check-out",
        dueDate: booking.checkInDate,
        status: "pending",
        createdAt: now,
        updatedAt: now
      });
    }

    return null;
  }
});
