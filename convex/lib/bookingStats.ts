import type { Doc } from "../_generated/dataModel";

const OCCUPANCY_STATUSES = new Set<
  Doc<"booking">["status"]
>(["confirmed", "checked_in", "pending_confirmation"]);

const REVENUE_STATUSES = new Set<Doc<"booking">["status"]>([
  "confirmed",
  "checked_in",
  "checked_out",
  "completed"
]);

export function isBookingActiveOnDate(
  booking: Doc<"booking">,
  today: string
): boolean {
  if (!OCCUPANCY_STATUSES.has(booking.status)) {
    return false;
  }
  if (booking.checkInDate > today) {
    return false;
  }
  if (
    booking.checkOutDate !== undefined &&
    booking.checkOutDate <= today
  ) {
    return false;
  }
  return true;
}

export function isBookingRevenueOnDate(
  booking: Doc<"booking">,
  today: string
): boolean {
  if (!REVENUE_STATUSES.has(booking.status)) {
    return false;
  }
  if (booking.checkInDate > today) {
    return false;
  }
  if (
    booking.checkOutDate !== undefined &&
    booking.checkOutDate < today
  ) {
    return false;
  }
  return true;
}
