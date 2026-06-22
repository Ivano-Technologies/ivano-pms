import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

function bookingArgs(
  seed: Awaited<ReturnType<typeof seedAuthedManager>>,
  overrides: {
    unitId?: typeof seed.unitId;
    guestId?: typeof seed.guestId;
    checkInDate?: string;
    checkOutDate?: string;
    status?: "inquiry" | "pending_confirmation" | "confirmed";
  } = {}
) {
  return {
    guestId: overrides.guestId ?? seed.guestId,
    unitId: overrides.unitId ?? seed.unitId,
    checkInDate: overrides.checkInDate ?? "2025-08-01",
    checkOutDate: overrides.checkOutDate ?? "2025-08-03",
    bookingType: "nightly" as const,
    sourceChannel: "direct" as const,
    totalPriceNgn: 50_000,
    status: overrides.status ?? ("confirmed" as const)
  };
}

describe("booking overlap detection", () => {
  it("allows sequential non-overlapping bookings on the same unit", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { checkInDate: "2025-08-01", checkOutDate: "2025-08-03" })
    );

    const id2 = await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { checkInDate: "2025-08-03", checkOutDate: "2025-08-05" })
    );

    expect(id2).toBeTruthy();
  });

  it("rejects overlapping dates on the same unit", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.bookings.createBooking, bookingArgs(seed));

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        bookingArgs(seed, { checkInDate: "2025-08-02", checkOutDate: "2025-08-04" })
      )
    ).rejects.toThrow(/Unit already booked for these dates/);
  });

  it("allows overlapping dates on different units", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const unit2 = await t.run(async (ctx) =>
      ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "102",
        unitType: "room",
        capacityGuests: 2,
        pricePerNightNgn: 25_000,
        amenities: [],
        availabilityStatus: "available",
        createdAt: now,
        updatedAt: now
      })
    );

    await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { unitId: seed.unitId })
    );

    const id2 = await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, {
        unitId: unit2,
        checkInDate: "2025-08-02",
        checkOutDate: "2025-08-04"
      })
    );

    expect(id2).toBeTruthy();
  });

  it("does not block new booking when existing booking is cancelled", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const bookingId = await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed)
    );

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "cancelled"
    });

    const id2 = await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { checkInDate: "2025-08-02", checkOutDate: "2025-08-04" })
    );

    expect(id2).toBeTruthy();
  });

  it("allows back-to-back bookings when checkout equals next check-in", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { checkInDate: "2025-08-01", checkOutDate: "2025-08-03" })
    );

    const id2 = await asManager.mutation(
      api.functions.bookings.createBooking,
      bookingArgs(seed, { checkInDate: "2025-08-03", checkOutDate: "2025-08-05" })
    );

    expect(id2).toBeTruthy();
  });

  it("blocks overlap when existing booking has no check-out date", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("booking", {
        propertyId: seed.propertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "monthly",
        checkInDate: "2025-08-01",
        adultsCount: 1,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 200_000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        bookingArgs(seed, { checkInDate: "2025-08-05", checkOutDate: "2025-08-07" })
      )
    ).rejects.toThrow(/Unit already booked for these dates/);
  });
});
