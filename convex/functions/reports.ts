import { v } from "convex/values";

import { authedQuery } from "../lib/customFunctions";

const revenueMonthRow = v.object({
  month: v.string(),
  revenueNgn: v.number(),
  bookingCount: v.number()
});

const occupancyUnitRow = v.object({
  unitId: v.id("unit"),
  unitNumber: v.string(),
  unitType: v.string(),
  occupiedNights: v.number(),
  totalNights: v.number(),
  occupancyRate: v.number()
});

function monthKeyFromTimestamp(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function listMonthsBack(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(monthKeyFromTimestamp(d.getTime()));
  }
  return months;
}

function enumerateDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

const ACTIVE_OCCUPANCY_STATUSES = new Set([
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in",
  "checked_out",
  "completed"
]);

function isNightOccupied(
  day: string,
  checkIn: string,
  checkOut: string | undefined
): boolean {
  // Hospitality convention: checkIn <= day < checkOut (checkout day not occupied)
  if (day < checkIn) return false;
  if (!checkOut) return day >= checkIn;
  return day < checkOut;
}

/**
 * Revenue grouped by booking createdAt month (YYYY-MM).
 * Partial current month is included as-is (no proration).
 */
export const getRevenueByMonth = authedQuery({
  args: {
    months: v.optional(v.number())
  },
  returns: v.array(revenueMonthRow),
  handler: async (ctx, args) => {
    const monthCount = args.months ?? 6;
    const targetMonths = listMonthsBack(monthCount);
    const propertyId = ctx.manager.propertyId;

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(200);

    const byMonth = new Map<string, { revenueNgn: number; bookingCount: number }>();
    for (const m of targetMonths) {
      byMonth.set(m, { revenueNgn: 0, bookingCount: 0 });
    }

    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const key = monthKeyFromTimestamp(b.createdAt);
      if (!byMonth.has(key)) continue;
      const row = byMonth.get(key)!;
      row.revenueNgn += b.totalPriceNgn;
      row.bookingCount += 1;
    }

    return targetMonths.map((month) => {
      const row = byMonth.get(month)!;
      return {
        month,
        revenueNgn: row.revenueNgn,
        bookingCount: row.bookingCount
      };
    });
  }
});

export const getOccupancyByUnit = authedQuery({
  args: {
    startDate: v.string(),
    endDate: v.string()
  },
  returns: v.array(occupancyUnitRow),
  handler: async (ctx, args) => {
    const propertyId = ctx.manager.propertyId;
    const days = enumerateDays(args.startDate, args.endDate);
    const totalNights = days.length;

    const units = await ctx.db
      .query("unit")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(100);

    const bookings = await ctx.db
      .query("booking")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .take(200);

    return units.map((unit) => {
      const unitBookings = bookings.filter(
        (b) =>
          b.unitId === unit._id && ACTIVE_OCCUPANCY_STATUSES.has(b.status)
      );

      let occupiedNights = 0;
      for (const day of days) {
        const occupied = unitBookings.some((b) =>
          isNightOccupied(day, b.checkInDate, b.checkOutDate)
        );
        if (occupied) occupiedNights += 1;
      }

      const occupancyRate =
        totalNights === 0 ? 0 : occupiedNights / totalNights;

      return {
        unitId: unit._id,
        unitNumber: unit.unitNumber,
        unitType: unit.unitType,
        occupiedNights,
        totalNights,
        occupancyRate
      };
    });
  }
});
