import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "../test/helpers";

describe("getBookingsByDateRange", () => {
  it("returns bookings overlapping the date range", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("booking", {
        propertyId: seed.propertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "nightly",
        checkInDate: "2026-06-10",
        checkOutDate: "2026-06-12",
        adultsCount: 2,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 50000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });

      await ctx.db.insert("booking", {
        propertyId: seed.propertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "nightly",
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-03",
        adultsCount: 1,
        childrenCount: 0,
        status: "inquiry",
        sourceChannel: "whatsapp",
        totalPriceNgn: 30000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });

      await ctx.db.insert("booking", {
        propertyId: seed.otherPropertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "nightly",
        checkInDate: "2026-06-10",
        checkOutDate: "2026-06-11",
        adultsCount: 1,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 10000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const bookings = await asManager.query(
      api.functions.bookings.getBookingsByDateRange,
      { startDate: "2026-06-01", endDate: "2026-06-30" }
    );

    expect(bookings).toHaveLength(1);
    expect(bookings[0]?.checkInDate).toBe("2026-06-10");
    expect(bookings[0]?.propertyId).toBe(seed.propertyId);
  });

  it("sorts results by checkIn ascending", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      for (const checkInDate of ["2026-06-20", "2026-06-05", "2026-06-12"]) {
        await ctx.db.insert("booking", {
          propertyId: seed.propertyId,
          guestId: seed.guestId,
          unitId: seed.unitId,
          bookingType: "nightly",
          checkInDate,
          checkOutDate: "2026-06-25",
          adultsCount: 1,
          childrenCount: 0,
          status: "confirmed",
          sourceChannel: "direct",
          totalPriceNgn: 20000,
          paidNgn: 0,
          createdAt: now,
          updatedAt: now
        });
      }
    });

    const bookings = await asManager.query(
      api.functions.bookings.getBookingsByDateRange,
      { startDate: "2026-06-01", endDate: "2026-06-30" }
    );

    expect(bookings.map((b) => b.checkInDate)).toEqual([
      "2026-06-05",
      "2026-06-12",
      "2026-06-20"
    ]);
  });

  it("excludes bookings that end before the range starts", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("booking", {
        propertyId: seed.propertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "nightly",
        checkInDate: "2026-05-28",
        checkOutDate: "2026-05-30",
        adultsCount: 1,
        childrenCount: 0,
        status: "checked_out",
        sourceChannel: "direct",
        totalPriceNgn: 20000,
        paidNgn: 20000,
        createdAt: now,
        updatedAt: now
      });
    });

    const bookings = await asManager.query(
      api.functions.bookings.getBookingsByDateRange,
      { startDate: "2026-06-01", endDate: "2026-06-30" }
    );

    expect(bookings).toHaveLength(0);
  });
});

describe("getUnits", () => {
  it("returns units scoped to the manager property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const units = await asManager.query(api.functions.units.getUnits, {});

    expect(units).toHaveLength(1);
    expect(units[0]?.unitNumber).toBe("101");
    expect(units[0]?.pricePerNightNgn).toBe(25000);
    expect(units[0]?.propertyId).toBe(seed.propertyId);
  });
});

describe("createBooking", () => {
  it("creates a booking for the manager property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const bookingId = await asManager.mutation(
      api.functions.bookings.createBooking,
      {
        guestId: seed.guestId,
        unitId: seed.unitId,
        checkInDate: "2026-06-15",
        checkOutDate: "2026-06-17",
        bookingType: "nightly",
        sourceChannel: "direct",
        totalPriceNgn: 50000,
        status: "pending_confirmation"
      }
    );

    const booking = await t.run(async (ctx) => ctx.db.get("booking", bookingId));

    expect(booking?.propertyId).toBe(seed.propertyId);
    expect(booking?.status).toBe("pending_confirmation");
    expect(booking?.checkInDate).toBe("2026-06-15");
  });

  it("rejects guests from another property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const otherGuestId = await t.run(async (ctx) =>
      ctx.db.insert("guest", {
        propertyId: seed.otherPropertyId,
        firstName: "Other",
        lastName: "Guest",
        phone: "+2348000000099",
        idType: "passport",
        idNumber: "X999",
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      })
    );

    await expect(
      asManager.mutation(api.functions.bookings.createBooking, {
        guestId: otherGuestId,
        unitId: seed.unitId,
        checkInDate: "2026-06-15",
        checkOutDate: "2026-06-16",
        bookingType: "nightly",
        sourceChannel: "direct",
        totalPriceNgn: 25000
      })
    ).rejects.toThrow(/Guest not found/);
  });
});
