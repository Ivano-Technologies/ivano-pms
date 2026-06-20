import { v } from "convex/values";

import { authedQuery } from "../lib/customFunctions";
import {
  isBookingActiveOnDate,
  isBookingRevenueOnDate
} from "../lib/bookingStats";

const bookingStatus = v.union(
  v.literal("inquiry"),
  v.literal("pending_confirmation"),
  v.literal("confirmed"),
  v.literal("checked_in"),
  v.literal("checked_out"),
  v.literal("completed"),
  v.literal("cancelled")
);

export const getDashboardStats = authedQuery({
  args: {
    today: v.string()
  },
  returns: v.object({
    propertyId: v.id("property"),
    occupancyRate: v.number(),
    revenueNgn: v.number(),
    pendingMessageCount: v.number(),
    totalUnits: v.number(),
    occupiedUnitsToday: v.number(),
    bookingCountByStatus: v.record(v.string(), v.number())
  }),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;

    const units = await ctx.db
      .query("unit")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(100);

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(100);

    const messages = await ctx.db
      .query("bookingChannelMessage")
      .withIndex("by_property_status_created", (q) =>
        q.eq("propertyId", propertyId).eq("status", "new")
      )
      .take(100);

    const occupiedUnitIds = new Set<string>();
    let revenueNgn = 0;
    const bookingCountByStatus: Record<string, number> = {};

    for (const booking of bookings) {
      bookingCountByStatus[booking.status] =
        (bookingCountByStatus[booking.status] ?? 0) + 1;

      if (isBookingActiveOnDate(booking, args.today)) {
        occupiedUnitIds.add(booking.unitId);
      }
      if (isBookingRevenueOnDate(booking, args.today)) {
        revenueNgn += booking.totalPriceNgn;
      }
    }

    const totalUnits = units.length;
    const occupiedUnitsToday = occupiedUnitIds.size;
    const occupancyRate =
      totalUnits === 0 ? 0 : occupiedUnitsToday / totalUnits;

    return {
      propertyId,
      occupancyRate,
      revenueNgn,
      pendingMessageCount: messages.length,
      totalUnits,
      occupiedUnitsToday,
      bookingCountByStatus
    };
  }
});

export { bookingStatus };
