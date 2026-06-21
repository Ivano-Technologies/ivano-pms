import { describe, expect, it } from "vitest";

import { BOOKING_STATUS_COLORS } from "@/lib/booking-status-colors";
import {
  addDays,
  countNights,
  getBookingSpanInWindow,
  getDayKey,
  getOccupancyForDay,
  getRollingDayKeys,
  isBookingOnDate,
  parseDayKey
} from "@/lib/calendar-utils";

describe("getDayKey", () => {
  it("formats dates as ISO YYYY-MM-DD", () => {
    expect(getDayKey(new Date(2026, 5, 15))).toBe("2026-06-15");
  });
});

describe("addDays", () => {
  it("advances by the requested number of days", () => {
    expect(addDays("2026-06-15", 1)).toBe("2026-06-16");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
  });
});

describe("getRollingDayKeys", () => {
  it("returns 30 consecutive day keys by default", () => {
    const keys = getRollingDayKeys("2026-06-01");
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-06-01");
    expect(keys[29]).toBe("2026-06-30");
  });

  it("supports custom window lengths", () => {
    expect(getRollingDayKeys("2026-06-01", 7)).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07"
    ]);
  });
});

describe("parseDayKey", () => {
  it("round-trips with getDayKey", () => {
    const key = "2026-06-15";
    expect(getDayKey(parseDayKey(key))).toBe(key);
  });
});

describe("isBookingOnDate", () => {
  const booking = {
    _id: "b1",
    unitId: "u1",
    guestId: "g1",
    checkInDate: "2026-06-10",
    checkOutDate: "2026-06-12",
    status: "confirmed" as const,
    sourceChannel: "direct"
  };

  it("includes check-in day and excludes check-out day", () => {
    expect(isBookingOnDate(booking, "2026-06-10")).toBe(true);
    expect(isBookingOnDate(booking, "2026-06-11")).toBe(true);
    expect(isBookingOnDate(booking, "2026-06-12")).toBe(false);
  });

  it("returns false before check-in", () => {
    expect(isBookingOnDate(booking, "2026-06-09")).toBe(false);
  });
});

describe("getOccupancyForDay", () => {
  const units = [
    { _id: "u1", unitNumber: "101", unitType: "room", pricePerNightNgn: 10000 },
    { _id: "u2", unitNumber: "102", unitType: "room", pricePerNightNgn: 12000 }
  ];

  it("returns an empty list when no bookings exist", () => {
    expect(getOccupancyForDay("2026-06-15", [], units)).toEqual([]);
  });

  it("returns occupancy entries for active bookings", () => {
    const bookings = [
      {
        _id: "b1",
        unitId: "u1",
        guestId: "g1",
        checkInDate: "2026-06-14",
        checkOutDate: "2026-06-16",
        status: "confirmed" as const,
        sourceChannel: "direct"
      }
    ];

    expect(getOccupancyForDay("2026-06-15", bookings, units)).toEqual([
      { unitId: "u1", status: "confirmed" }
    ]);
  });

  it("ignores bookings for units outside the property list", () => {
    const bookings = [
      {
        _id: "b1",
        unitId: "u9",
        guestId: "g1",
        checkInDate: "2026-06-14",
        checkOutDate: "2026-06-16",
        status: "confirmed" as const,
        sourceChannel: "direct"
      }
    ];

    expect(getOccupancyForDay("2026-06-15", bookings, units)).toEqual([]);
  });
});

describe("getBookingSpanInWindow", () => {
  const windowDays = getRollingDayKeys("2026-06-01", 10);

  it("computes span within the visible window", () => {
    const span = getBookingSpanInWindow(
      {
        _id: "b1",
        unitId: "u1",
        guestId: "g1",
        checkInDate: "2026-06-03",
        checkOutDate: "2026-06-06",
        status: "confirmed",
        sourceChannel: "direct"
      },
      windowDays
    );

    expect(span).toEqual({ dayStartIndex: 2, span: 3 });
  });

  it("returns null when booking is outside the window", () => {
    const span = getBookingSpanInWindow(
      {
        _id: "b1",
        unitId: "u1",
        guestId: "g1",
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-03",
        status: "confirmed",
        sourceChannel: "direct"
      },
      windowDays
    );

    expect(span).toBeNull();
  });
});

describe("countNights", () => {
  it("counts nights between check-in and check-out", () => {
    expect(countNights("2026-06-15", "2026-06-17")).toBe(2);
  });

  it("returns at least one night for same-day checkout edge case", () => {
    expect(countNights("2026-06-15", "2026-06-15")).toBe(1);
  });
});

describe("BOOKING_STATUS_COLORS", () => {
  it("includes all locked Week 2 statuses", () => {
    expect(Object.keys(BOOKING_STATUS_COLORS).sort()).toEqual(
      [
        "cancelled",
        "checked_in",
        "checked_out",
        "completed",
        "confirmed",
        "inquiry",
        "pending_confirmation"
      ].sort()
    );
  });

  it("maps each status to tailwind utility classes", () => {
    for (const value of Object.values(BOOKING_STATUS_COLORS)) {
      expect(value).toMatch(/bg-/);
      expect(value).toMatch(/text-/);
    }
  });
});
