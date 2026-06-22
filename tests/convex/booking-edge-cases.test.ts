import { describe, expect, it } from "vitest";

import type { Id } from "../../convex/_generated/dataModel";
import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

type EdgeSeed = Awaited<ReturnType<typeof seedEdgeCaseFixture>>;

async function seedEdgeCaseFixture(t: ReturnType<typeof createTestConvex>) {
  const base = await seedAuthedManager(t);
  const now = Date.now();

  const extra = await t.run(async (ctx) => {
    const unitIds: Id<"unit">[] = [];
    const guestIds: Id<"guest">[] = [];

    for (const unitNumber of ["102", "103"]) {
      unitIds.push(
        await ctx.db.insert("unit", {
          propertyId: base.propertyId,
          unitNumber,
          unitType: "room",
          capacityGuests: 2,
          pricePerNightNgn: 25000,
          amenities: ["wifi"],
          availabilityStatus: "available",
          createdAt: now,
          updatedAt: now
        })
      );
    }

    for (const [firstName, lastName, phone] of [
      ["Chidi", "Eze", "+2348000000003"],
      ["Ngozi", "Ade", "+2348000000004"]
    ] as const) {
      guestIds.push(
        await ctx.db.insert("guest", {
          propertyId: base.propertyId,
          firstName,
          lastName,
          phone,
          idType: "passport",
          idNumber: `${firstName}-ID`,
          isDeleted: false,
          createdAt: now,
          updatedAt: now
        })
      );
    }

    const managerBClerk = "clerk_test_manager_002";
    await ctx.db.insert("manager", {
      propertyId: base.otherPropertyId,
      clerkUserId: managerBClerk,
      email: "manager-b@test.com",
      fullName: "Manager B",
      phone: "+2348000000010",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });

    return { unitIds, guestIds, managerBClerk };
  });

  return {
    ...base,
    unitIds: [base.unitId, ...extra.unitIds],
    guestIds: [base.guestId, ...extra.guestIds],
    managerBClerk: extra.managerBClerk
  };
}

function createBookingInput(
  seed: EdgeSeed,
  overrides: {
    unitId?: Id<"unit">;
    guestId?: Id<"guest">;
    checkInDate?: string;
    checkOutDate?: string;
    status?: "inquiry" | "pending_confirmation" | "confirmed";
  } = {}
) {
  return {
    guestId: overrides.guestId ?? seed.guestIds[0]!,
    unitId: overrides.unitId ?? seed.unitIds[0]!,
    checkInDate: overrides.checkInDate ?? "2025-07-01",
    checkOutDate: overrides.checkOutDate ?? "2025-07-03",
    bookingType: "nightly" as const,
    sourceChannel: "direct" as const,
    totalPriceNgn: 50_000,
    status: overrides.status ?? ("confirmed" as const)
  };
}

describe("overlapping bookings", () => {
  it("creates booking A (July 1–3) as confirmed", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const bookingId = await asManager.mutation(
      api.functions.bookings.createBooking,
      createBookingInput(seed)
    );

    const booking = await t.run(async (ctx) => ctx.db.get("booking", bookingId));
    expect(booking?.status).toBe("confirmed");
  });

  it("rejects overlapping booking B on the same unit", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const unitId = seed.unitIds[0]!;

    await asManager.mutation(
      api.functions.bookings.createBooking,
      createBookingInput(seed, { unitId })
    );

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        createBookingInput(seed, {
          unitId,
          guestId: seed.guestIds[1]!,
          checkInDate: "2025-07-02",
          checkOutDate: "2025-07-04"
        })
      )
    ).rejects.toThrow(/Unit already booked for these dates/);
  });

  it("rejects a containing booking C that overlaps existing booking A", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const unitId = seed.unitIds[0]!;

    await asManager.mutation(
      api.functions.bookings.createBooking,
      createBookingInput(seed, { unitId })
    );

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        createBookingInput(seed, {
          unitId,
          guestId: seed.guestIds[2]!,
          checkInDate: "2025-07-01",
          checkOutDate: "2025-07-10"
        })
      )
    ).rejects.toThrow(/Unit already booked for these dates/);
  });
});

describe("boundary dates", () => {
  it("rejects same-day check-in and check-out", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        createBookingInput(seed, {
          checkInDate: "2025-07-05",
          checkOutDate: "2025-07-05"
        })
      )
    ).rejects.toThrow(/Check-out must be after check-in/);
  });

  it("rejects check-out before check-in", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await expect(
      asManager.mutation(
        api.functions.bookings.createBooking,
        createBookingInput(seed, {
          checkInDate: "2025-07-10",
          checkOutDate: "2025-07-05"
        })
      )
    ).rejects.toThrow(/Check-out must be after check-in/);
  });
});

describe("foreign key violations", () => {
  it("rejects a deleted unit id", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const missingUnitId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("unit", {
        propertyId: seed.propertyId,
        unitNumber: "999",
        unitType: "room",
        capacityGuests: 1,
        pricePerNightNgn: 10_000,
        amenities: [],
        availabilityStatus: "available",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      await ctx.db.delete("unit", id);
      return id;
    });

    await expect(
      asManager.mutation(api.functions.bookings.createBooking, {
        ...createBookingInput(seed),
        unitId: missingUnitId
      })
    ).rejects.toThrow(/Unit not found/);
  });

  it("rejects a deleted guest id", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const missingGuestId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("guest", {
        propertyId: seed.propertyId,
        firstName: "Temp",
        lastName: "Guest",
        phone: "+2348000000099",
        idType: "passport",
        idNumber: "TEMP",
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      await ctx.db.delete("guest", id);
      return id;
    });

    await expect(
      asManager.mutation(api.functions.bookings.createBooking, {
        ...createBookingInput(seed),
        guestId: missingGuestId
      })
    ).rejects.toThrow(/Guest not found/);
  });
});

describe("property scoping", () => {
  it("manager B cannot create a booking using property A guest/unit ids", async () => {
    const t = createTestConvex();
    const seed = await seedEdgeCaseFixture(t);
    const asManagerA = authedClient(t, seed.clerkUserId);
    const asManagerB = authedClient(t, seed.managerBClerk);

    await asManagerA.mutation(
      api.functions.bookings.createBooking,
      createBookingInput(seed)
    );

    await expect(
      asManagerB.mutation(api.functions.bookings.createBooking, {
        ...createBookingInput(seed),
        guestId: seed.guestIds[0]!,
        unitId: seed.unitIds[0]!
      })
    ).rejects.toThrow(/Guest not found/);
  });
});
