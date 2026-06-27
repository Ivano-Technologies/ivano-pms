import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const OVERLAP_BLOCK_STATUSES = new Set([
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in"
]);

export function addDaysIso(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Rejects overlapping bookings on the same unit for active statuses.
 * Scans up to 200 bookings per unit (see ADR-006).
 */
export async function checkBookingOverlap(
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
      throw new ConvexError("Unit already booked for these dates");
    }
  }
}

export function countNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00`).getTime();
  const end = new Date(`${checkOut}T00:00:00`).getTime();
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}
