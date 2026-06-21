import { convexTest } from "convex-test";

import { api } from "../_generated/api";
import schema from "../schema";

export const modules = import.meta.glob("../**/*.ts");

export function createTestConvex() {
  return convexTest(schema, modules);
}

export async function seedAuthedManager(t: ReturnType<typeof createTestConvex>) {
  const clerkUserId = "clerk_test_manager_001";
  const now = Date.now();

  return await t.run(async (ctx) => {
    const propertyId = await ctx.db.insert("property", {
      name: "Test Property",
      address: "1 Test Lane",
      phone: "+2348000000000",
      whatsapp: "+2348000000000",
      currencyCode: "NGN",
      timezone: "Africa/Lagos",
      createdAt: now,
      updatedAt: now
    });

    const otherPropertyId = await ctx.db.insert("property", {
      name: "Other Property",
      address: "2 Other Lane",
      phone: "+2348000000001",
      whatsapp: "+2348000000001",
      currencyCode: "NGN",
      timezone: "Africa/Lagos",
      createdAt: now,
      updatedAt: now
    });

    const managerId = await ctx.db.insert("manager", {
      propertyId,
      clerkUserId,
      email: "manager@test.com",
      fullName: "Test Manager",
      phone: "+2348000000000",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });

    const unitId = await ctx.db.insert("unit", {
      propertyId,
      unitNumber: "101",
      unitType: "room",
      capacityGuests: 2,
      pricePerNightNgn: 25000,
      amenities: ["wifi"],
      availabilityStatus: "available",
      createdAt: now,
      updatedAt: now
    });

    const guestId = await ctx.db.insert("guest", {
      propertyId,
      firstName: "Ada",
      lastName: "Okonkwo",
      phone: "+2348000000002",
      idType: "passport",
      idNumber: "A12345678",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("unit", {
      propertyId: otherPropertyId,
      unitNumber: "201",
      unitType: "suite",
      capacityGuests: 4,
      pricePerNightNgn: 50000,
      amenities: [],
      availabilityStatus: "available",
      createdAt: now,
      updatedAt: now
    });

    return {
      propertyId,
      otherPropertyId,
      managerId,
      clerkUserId,
      unitId,
      guestId
    };
  });
}

export function authedClient(
  t: ReturnType<typeof createTestConvex>,
  clerkUserId: string
) {
  return t.withIdentity({ subject: clerkUserId });
}

export { api };
