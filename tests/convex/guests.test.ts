import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

describe("getGuests", () => {
  it("returns non-deleted guests for the manager property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const guests = await asManager.query(api.functions.guests.getGuests, {});

    expect(guests).toHaveLength(1);
    expect(guests[0]?.firstName).toBe("Ada");
    expect(guests[0]?.propertyId).toBe(seed.propertyId);
  });

  it("excludes soft-deleted guests", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.guests.softDeleteGuest, {
      guestId: seed.guestId
    });

    const guests = await asManager.query(api.functions.guests.getGuests, {});
    expect(guests).toHaveLength(0);
  });
});

describe("createGuest", () => {
  it("creates a guest on the manager property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const guestId = await asManager.mutation(api.functions.guests.createGuest, {
      firstName: "Tunde",
      lastName: "Bello",
      phone: "+2348000000100",
      idType: "passport",
      idNumber: "B98765432",
      email: "tunde@example.com"
    });

    const guest = await t.run(async (ctx) => ctx.db.get("guest", guestId));
    expect(guest?.propertyId).toBe(seed.propertyId);
    expect(guest?.firstName).toBe("Tunde");
    expect(guest?.email).toBe("tunde@example.com");
  });
});

describe("updateGuest", () => {
  it("updates guest fields", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const updated = await asManager.mutation(api.functions.guests.updateGuest, {
      guestId: seed.guestId,
      firstName: "Ada",
      lastName: "Okafor",
      phone: "+2348000000002",
      idType: "national_id",
      idNumber: "NG-123",
      email: "ada@example.com"
    });

    expect(updated.lastName).toBe("Okafor");
    expect(updated.idType).toBe("national_id");
  });
});

describe("getGuestById", () => {
  it("returns guest with active booking count", async () => {
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
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-03",
        adultsCount: 1,
        childrenCount: 0,
        status: "confirmed",
        sourceChannel: "direct",
        totalPriceNgn: 50_000,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    const guest = await asManager.query(api.functions.guests.getGuestById, {
      guestId: seed.guestId
    });

    expect(guest.firstName).toBe("Ada");
    expect(guest.activeBookingCount).toBe(1);
  });
});

describe("softDeleteGuest and restoreGuest", () => {
  it("soft deletes and restores within 30 seconds", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.guests.softDeleteGuest, {
      guestId: seed.guestId
    });

    const deleted = await t.run(async (ctx) => ctx.db.get("guest", seed.guestId));
    expect(deleted?.isDeleted).toBe(true);
    expect(deleted?.deletedAt).toBeTruthy();

    const restored = await asManager.mutation(api.functions.guests.restoreGuest, {
      guestId: seed.guestId
    });
    expect(restored.isDeleted).toBe(false);

    const guests = await asManager.query(api.functions.guests.getGuests, {});
    expect(guests).toHaveLength(1);
  });

  it("rejects restore after the window expires", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.guests.softDeleteGuest, {
      guestId: seed.guestId
    });

    await t.run(async (ctx) => {
      await ctx.db.patch("guest", seed.guestId, {
        deletedAt: Date.now() - 31_000
      });
    });

    await expect(
      asManager.mutation(api.functions.guests.restoreGuest, {
        guestId: seed.guestId
      })
    ).rejects.toThrow(/Restore window expired/);
  });
});

describe("property scoping", () => {
  it("denies update on another property guest", async () => {
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
      asManager.mutation(api.functions.guests.updateGuest, {
        guestId: otherGuestId,
        firstName: "Other",
        lastName: "Guest",
        phone: "+2348000000099",
        idType: "passport",
        idNumber: "X999"
      })
    ).rejects.toThrow(/Not authorized for this property/);
  });
});
