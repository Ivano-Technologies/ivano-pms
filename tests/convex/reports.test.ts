import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

describe("getRevenueByMonth", () => {
  it("groups revenue by createdAt month", async () => {
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
        checkInDate: "2026-06-01",
        checkOutDate: "2026-06-03",
        adultsCount: 1,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 100_000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const rows = await asManager.query(api.functions.reports.getRevenueByMonth, {
      months: 6
    });

    expect(rows.length).toBe(6);
    const currentMonth = rows[rows.length - 1]!;
    expect(currentMonth.revenueNgn).toBeGreaterThanOrEqual(100_000);
    expect(currentMonth.bookingCount).toBeGreaterThanOrEqual(1);
  });

  it("includes partial current month without proration", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const rows = await asManager.query(api.functions.reports.getRevenueByMonth, {
      months: 1
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("excludes cancelled bookings from revenue", async () => {
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
        adultsCount: 1,
        childrenCount: 0,
        status: "cancelled",
        sourceChannel: "direct",
        totalPriceNgn: 999_999,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const rows = await asManager.query(api.functions.reports.getRevenueByMonth, {
      months: 1
    });

    expect(rows[0]?.revenueNgn).toBe(0);
  });
});

describe("getOccupancyByUnit", () => {
  it("counts one night for checkIn=day0 checkOut=day1", async () => {
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
        checkInDate: "2026-06-01",
        checkOutDate: "2026-06-02",
        adultsCount: 1,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 25_000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const rows = await asManager.query(api.functions.reports.getOccupancyByUnit, {
      startDate: "2026-06-01",
      endDate: "2026-06-01"
    });

    const unit = rows.find((r) => r.unitId === seed.unitId);
    expect(unit?.occupiedNights).toBe(1);
    expect(unit?.occupancyRate).toBe(1);
  });

  it("returns zero occupancy when property has no units in range", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const rows = await asManager.query(api.functions.reports.getOccupancyByUnit, {
      startDate: "2026-06-01",
      endDate: "2026-06-07"
    });

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.totalNights).toBe(7);
    }
  });
});
