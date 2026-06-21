import type { BookingStatusKey } from "@/lib/booking-status-colors";

export type CalendarBooking = {
  _id: string;
  unitId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate?: string;
  status: BookingStatusKey;
  sourceChannel: string;
};

export type CalendarUnit = {
  _id: string;
  unitNumber: string;
  unitType: string;
  pricePerNightNgn: number;
};

/** ISO date YYYY-MM-DD in local calendar (client passes `today`). */
export function getDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

export function addDays(dayKey: string, days: number): string {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + days);
  return getDayKey(date);
}

/** Rolling 30-day window starting at `startDayKey` (inclusive). */
export function getRollingDayKeys(startDayKey: string, count = 30): string[] {
  const keys: string[] = [];
  let current = startDayKey;
  for (let i = 0; i < count; i += 1) {
    keys.push(current);
    current = addDays(current, 1);
  }
  return keys;
}

export function formatDayHeader(dayKey: string): string {
  const date = parseDayKey(dayKey);
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric"
  }).format(date);
}

export function formatMonthYear(dayKey: string): string {
  const date = parseDayKey(dayKey);
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric"
  }).format(date);
}

/** Booking occupies a night on `dayKey` (check-in inclusive, check-out exclusive). */
export function isBookingOnDate(booking: CalendarBooking, dayKey: string): boolean {
  if (booking.checkInDate > dayKey) {
    return false;
  }
  if (booking.checkOutDate !== undefined && booking.checkOutDate <= dayKey) {
    return false;
  }
  return true;
}

export function getOccupancyForDay(
  dayKey: string,
  bookings: CalendarBooking[],
  units: CalendarUnit[]
): { unitId: string; status: BookingStatusKey }[] {
  const unitIds = new Set(units.map((u) => u._id));
  const occupied: { unitId: string; status: BookingStatusKey }[] = [];

  for (const booking of bookings) {
    if (!unitIds.has(booking.unitId)) {
      continue;
    }
    if (isBookingOnDate(booking, dayKey)) {
      occupied.push({ unitId: booking.unitId, status: booking.status });
    }
  }

  return occupied;
}

export function getBookingSpanInWindow(
  booking: CalendarBooking,
  windowDays: string[]
): { dayStartIndex: number; span: number } | null {
  if (windowDays.length === 0) {
    return null;
  }

  const windowStart = windowDays[0]!;
  const windowEnd = windowDays[windowDays.length - 1]!;

  if (booking.checkInDate > windowEnd) {
    return null;
  }

  const checkout = booking.checkOutDate ?? addDays(windowEnd, 1);
  if (checkout <= windowStart) {
    return null;
  }

  let startIdx = windowDays.findIndex((d) => d >= booking.checkInDate);
  if (startIdx === -1) {
    startIdx = 0;
  }

  let endIdx: number;
  if (booking.checkOutDate) {
    const checkoutIdx = windowDays.findIndex((d) => d >= booking.checkOutDate!);
    endIdx = checkoutIdx <= 0 ? windowDays.length - 1 : checkoutIdx - 1;
  } else {
    endIdx = windowDays.length - 1;
  }

  if (startIdx > endIdx) {
    return null;
  }

  return { dayStartIndex: startIdx, span: endIdx - startIdx + 1 };
}

export function countNights(checkInDate: string, checkOutDate: string): number {
  const start = parseDayKey(checkInDate).getTime();
  const end = parseDayKey(checkOutDate).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}
