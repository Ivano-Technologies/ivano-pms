import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

describe("getMyProperties", () => {
  it("returns properties linked to the clerk user", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const properties = await asManager.query(
      api.functions.managers.getMyProperties,
      {}
    );

    expect(properties.length).toBeGreaterThanOrEqual(1);
    expect(properties.some((p) => p._id === seed.propertyId)).toBe(true);
    expect(properties[0]?.name).toBe("Test Property");
  });

  it("returns multiple properties when manager has multiple records", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("manager", {
        propertyId: seed.otherPropertyId,
        clerkUserId: seed.clerkUserId,
        email: "manager@test.com",
        fullName: "Test Manager",
        phone: "+2348000000000",
        role: "owner",
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
    });

    const properties = await asManager.query(
      api.functions.managers.getMyProperties,
      {}
    );

    expect(properties).toHaveLength(2);
  });
});

describe("selectedPropertyId scoping", () => {
  it("scopes getGuests to selected property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.run(async (ctx) => {
      await ctx.db.insert("manager", {
        propertyId: seed.otherPropertyId,
        clerkUserId: seed.clerkUserId,
        email: "manager@test.com",
        fullName: "Test Manager",
        phone: "+2348000000000",
        role: "owner",
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
      await ctx.db.insert("guest", {
        propertyId: seed.otherPropertyId,
        firstName: "Other",
        lastName: "Property",
        phone: "+2348000000099",
        idType: "passport",
        idNumber: "OP-1",
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
    });

    const mainGuests = await asManager.query(api.functions.guests.getGuests, {
      selectedPropertyId: seed.propertyId
    });
    const otherGuests = await asManager.query(api.functions.guests.getGuests, {
      selectedPropertyId: seed.otherPropertyId
    });

    expect(mainGuests.every((g) => g.propertyId === seed.propertyId)).toBe(
      true
    );
    expect(otherGuests.some((g) => g.firstName === "Other")).toBe(true);
  });
});
