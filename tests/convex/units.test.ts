import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

describe("createUnit", () => {
  it("inserts with default availabilityStatus='available'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const unitId = await asManager.mutation(api.functions.units.createUnit, {
      unitNumber: "Suite A",
      unitType: "suite",
      capacityGuests: 4,
      pricePerNightNgn: 75_000,
      amenities: ["WiFi", "AC"]
    });

    const unit = await t.run(async (ctx) => ctx.db.get("unit", unitId));
    expect(unit?.unitNumber).toBe("Suite A");
    expect(unit?.unitType).toBe("suite");
    expect(unit?.availabilityStatus).toBe("available");
    expect(unit?.propertyId).toBe(seed.propertyId);
    expect(unit?.amenities).toEqual(["WiFi", "AC"]);
  });

  it("enforces property scoping via ctx.manager.propertyId", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const unitId = await asManager.mutation(api.functions.units.createUnit, {
      unitNumber: "V1",
      unitType: "villa",
      capacityGuests: 8,
      pricePerNightNgn: 150_000
    });

    const unit = await t.run(async (ctx) => ctx.db.get("unit", unitId));
    expect(unit?.propertyId).toBe(seed.propertyId);
    expect(unit?.propertyId).not.toBe(seed.otherPropertyId);
  });
});

describe("updateUnit", () => {
  it("updates only provided fields, leaves others intact", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.units.updateUnit, {
      unitId: seed.unitId,
      pricePerNightNgn: 30_000
    });

    const unit = await t.run(async (ctx) => ctx.db.get("unit", seed.unitId));
    expect(unit?.pricePerNightNgn).toBe(30_000);
    expect(unit?.unitNumber).toBe("101");
    expect(unit?.unitType).toBe("room");
    expect(unit?.capacityGuests).toBe(2);
  });

  it("rejects cross-property access", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const otherUnitId = await t.run(async (ctx) =>
      ctx.db.insert("unit", {
        propertyId: seed.otherPropertyId,
        unitNumber: "Other-101",
        unitType: "room",
        capacityGuests: 2,
        pricePerNightNgn: 20_000,
        amenities: [],
        availabilityStatus: "available",
        createdAt: now,
        updatedAt: now
      })
    );

    await expect(
      asManager.mutation(api.functions.units.updateUnit, {
        unitId: otherUnitId,
        unitNumber: "Hacked"
      })
    ).rejects.toThrow(/Not authorized for this property/);
  });
});

describe("setUnitAvailability", () => {
  it("updates only availabilityStatus, leaves other fields intact", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.units.setUnitAvailability, {
      unitId: seed.unitId,
      availabilityStatus: "maintenance"
    });

    const unit = await t.run(async (ctx) => ctx.db.get("unit", seed.unitId));
    expect(unit?.availabilityStatus).toBe("maintenance");
    expect(unit?.unitNumber).toBe("101");
    expect(unit?.pricePerNightNgn).toBe(25_000);
  });
});

describe("getUnits", () => {
  it("excludes maintenance and reserved by default (includeMaintenanceReserved=false)", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "M-01",
        unitType: "room",
        capacityGuests: 2,
        pricePerNightNgn: 20_000,
        amenities: [],
        availabilityStatus: "maintenance",
        createdAt: now,
        updatedAt: now
      });
      await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "R-01",
        unitType: "room",
        capacityGuests: 2,
        pricePerNightNgn: 20_000,
        amenities: [],
        availabilityStatus: "reserved",
        createdAt: now,
        updatedAt: now
      });
    });

    const units = await asManager.query(api.functions.units.getUnits, {});
    expect(units.every((u) => u.availabilityStatus === "available")).toBe(true);
  });

  it("returns all 4 statuses when includeMaintenanceReserved=true", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "M-02",
        unitType: "studio",
        capacityGuests: 1,
        pricePerNightNgn: 15_000,
        amenities: [],
        availabilityStatus: "maintenance",
        createdAt: now,
        updatedAt: now
      });
      await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "R-02",
        unitType: "suite",
        capacityGuests: 3,
        pricePerNightNgn: 60_000,
        amenities: [],
        availabilityStatus: "reserved",
        createdAt: now,
        updatedAt: now
      });
      await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "O-02",
        unitType: "villa",
        capacityGuests: 6,
        pricePerNightNgn: 100_000,
        amenities: [],
        availabilityStatus: "occupied",
        createdAt: now,
        updatedAt: now
      });
    });

    const units = await asManager.query(api.functions.units.getUnits, {
      includeMaintenanceReserved: true
    });

    const statuses = new Set(units.map((u) => u.availabilityStatus));
    expect(statuses.has("available")).toBe(true);
    expect(statuses.has("maintenance")).toBe(true);
    expect(statuses.has("reserved")).toBe(true);
    expect(statuses.has("occupied")).toBe(true);
  });
});

describe("getUnitById", () => {
  it("derives occupancyStatus='occupied' from active booking covering today", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    // Insert a booking that straddles today (2026-06-20 to 2026-06-25)
    await t.run(async (ctx) => {
      await ctx.db.insert("booking", {
        propertyId: seed.propertyId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        bookingType: "nightly",
        checkInDate: "2026-06-20",
        checkOutDate: "2026-06-25",
        adultsCount: 2,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 125_000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const unit = await asManager.query(api.functions.units.getUnitById, {
      unitId: seed.unitId
    });

    expect(unit.unitNumber).toBe("101");
    expect(unit.occupancyStatus).toBe("occupied");
  });
});
