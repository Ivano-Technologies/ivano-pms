import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { assertPropertyAccess } from "../lib/auth";
import {
  getAvailableTransitions,
  isValidTransition,
  type BookingStatusType
} from "../lib/bookingStates";
import { authedMutation, authedQuery } from "../lib/customFunctions";

const OVERLAP_BLOCK_STATUSES = new Set([
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in"
]);

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Rejects overlapping bookings on the same unit for active statuses.
 * Scans up to 200 bookings per unit (see ADR-006).
 */
async function checkOverlap(
  ctx: MutationCtx,
  unitId: Id<"unit">,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: Id<"booking">
): Promise<void> {
  const existing = await ctx.db
    .query("booking")
    .withIndex("by_unit", (q) => q.eq("unitId", unitId))
    .take(200);

  for (const b of existing) {
    if (excludeBookingId && b._id === excludeBookingId) continue;
    if (!OVERLAP_BLOCK_STATUSES.has(b.status)) continue;
    const existingOut = b.checkOutDate ?? checkOut;
    if (b.checkInDate < checkOut && existingOut > checkIn) {
      throw new Error("Unit already booked for these dates");
    }
  }
}

const bookingType = v.union(
  v.literal("nightly"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("lease")
);

export const bookingStatus = v.union(
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

const bookingWithGuestUnit = v.object({
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
  updatedAt: v.number(),
  guestName: v.string(),
  guestPhone: v.string(),
  guestEmail: v.optional(v.string()),
  unitNumber: v.string(),
  unitType: v.string()
});

const auditTrailEntry = v.object({
  _id: v.id("auditLog"),
  action: v.union(
    v.literal("create"),
    v.literal("update"),
    v.literal("delete"),
    v.literal("status_change"),
    v.literal("booking_convert"),
    v.literal("payment_received")
  ),
  entityType: v.union(
    v.literal("guest"),
    v.literal("booking"),
    v.literal("unit"),
    v.literal("manager"),
    v.literal("checklist")
  ),
  entityId: v.string(),
  oldValues: v.optional(v.any()),
  newValues: v.optional(v.any()),
  actorId: v.optional(v.id("manager")),
  actorName: v.optional(v.string()),
  createdAt: v.number()
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

export const getBookingById = authedQuery({
  args: {
    bookingId: v.id("booking")
  },
  returns: bookingWithGuestUnit,
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    const guest = await ctx.db.get("guest", booking.guestId);
    if (!guest || guest.propertyId !== booking.propertyId) {
      throw new Error("Guest not found");
    }

    const unit = await ctx.db.get("unit", booking.unitId);
    if (!unit || unit.propertyId !== booking.propertyId) {
      throw new Error("Unit not found");
    }

    return {
      ...booking,
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestPhone: guest.phone,
      guestEmail: guest.email,
      unitNumber: unit.unitNumber,
      unitType: unit.unitType
    };
  }
});

export const getBookingAuditTrail = authedQuery({
  args: {
    bookingId: v.id("booking")
  },
  returns: v.array(auditTrailEntry),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_property", (q) =>
        q.eq("propertyId", booking.propertyId)
      )
      .take(200);

    const filtered = logs
      .filter(
        (log) =>
          log.entityType === "booking" && log.entityId === args.bookingId
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const enriched = await Promise.all(
      filtered.map(async (log) => {
        let actorName: string | undefined;
        if (log.actorId) {
          const actor = await ctx.db.get("manager", log.actorId);
          actorName = actor?.fullName;
        }
        return {
          _id: log._id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValues: log.oldValues,
          newValues: log.newValues,
          actorId: log.actorId,
          actorName,
          createdAt: log.createdAt
        };
      })
    );

    return enriched;
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

    if (args.checkOutDate && args.checkOutDate <= args.checkInDate) {
      throw new Error("Check-out must be after check-in");
    }

    const effectiveCheckOut = args.checkOutDate ?? addDays(args.checkInDate, 1);
    await checkOverlap(ctx, args.unitId, args.checkInDate, effectiveCheckOut);

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
    newStatus: bookingStatus,
    reason: v.optional(v.string())
  },
  returns: v.object({
    success: v.literal(true),
    booking: v.object({
      id: v.id("booking"),
      status: bookingStatus,
      updatedAt: v.number()
    })
  }),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    const oldStatus = booking.status as BookingStatusType;
    const newStatus = args.newStatus as BookingStatusType;

    if (!isValidTransition(oldStatus, newStatus)) {
      throw new Error(
        `Cannot transition booking from ${oldStatus} to ${newStatus}`
      );
    }

    const now = Date.now();
    await ctx.db.patch("booking", args.bookingId, {
      status: args.newStatus,
      updatedAt: now
    });

    await ctx.db.insert("auditLog", {
      propertyId: booking.propertyId,
      entityType: "booking",
      entityId: args.bookingId,
      action: "status_change",
      oldValues: { status: oldStatus },
      newValues: { status: newStatus, reason: args.reason ?? null },
      actorId: ctx.manager._id,
      createdAt: now
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

    return {
      success: true as const,
      booking: {
        id: args.bookingId,
        status: args.newStatus,
        updatedAt: now
      }
    };
  }
});

/** Exposed for UI action buttons (mirrors convex/lib/booking-states). */
export const getBookingStatusTransitions = authedQuery({
  args: {
    status: bookingStatus
  },
  returns: v.array(bookingStatus),
  handler: async (_ctx, args) => {
    return [...getAvailableTransitions(args.status as BookingStatusType)];
  }
});
