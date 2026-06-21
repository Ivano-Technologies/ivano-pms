import { describe, expect, it } from "vitest";

import {
  getAvailableTransitions,
  getTransitionLabel,
  isValidTransition
} from "../../convex/lib/bookingStates";
import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

async function insertBooking(
  t: ReturnType<typeof createTestConvex>,
  seed: Awaited<ReturnType<typeof seedAuthedManager>>,
  status:
    | "inquiry"
    | "pending_confirmation"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "completed"
    | "cancelled",
  propertyId = seed.propertyId
) {
  const now = Date.now();
  return await t.run(async (ctx) =>
    ctx.db.insert("booking", {
      propertyId,
      guestId: seed.guestId,
      unitId: seed.unitId,
      bookingType: "nightly",
      checkInDate: "2026-06-15",
      checkOutDate: "2026-06-17",
      adultsCount: 2,
      childrenCount: 0,
      status,
      sourceChannel: "direct",
      totalPriceNgn: 50000,
      paidNgn: 0,
      createdAt: now,
      updatedAt: now
    })
  );
}

describe("booking-states", () => {
  it("allows inquiry → pending_confirmation", () => {
    expect(isValidTransition("inquiry", "pending_confirmation")).toBe(true);
  });

  it("allows inquiry → confirmed", () => {
    expect(isValidTransition("inquiry", "confirmed")).toBe(true);
  });

  it("allows pending_confirmation → confirmed", () => {
    expect(isValidTransition("pending_confirmation", "confirmed")).toBe(true);
  });

  it("allows confirmed → checked_in", () => {
    expect(isValidTransition("confirmed", "checked_in")).toBe(true);
  });

  it("allows checked_in → checked_out", () => {
    expect(isValidTransition("checked_in", "checked_out")).toBe(true);
  });

  it("allows checked_out → completed", () => {
    expect(isValidTransition("checked_out", "completed")).toBe(true);
  });

  it("rejects confirmed → inquiry", () => {
    expect(isValidTransition("confirmed", "inquiry")).toBe(false);
  });

  it("rejects completed → any transition", () => {
    expect(getAvailableTransitions("completed")).toEqual([]);
    expect(isValidTransition("completed", "cancelled")).toBe(false);
  });

  it("rejects cancelled → any transition", () => {
    expect(getAvailableTransitions("cancelled")).toEqual([]);
    expect(isValidTransition("cancelled", "confirmed")).toBe(false);
  });

  it("provides transition labels", () => {
    expect(getTransitionLabel("inquiry", "pending_confirmation")).toBe(
      "Mark Pending"
    );
    expect(getTransitionLabel("checked_out", "completed")).toBe("Complete");
  });
});

describe("updateBookingStatus", () => {
  it("transitions inquiry → pending_confirmation", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "inquiry");

    const result = await asManager.mutation(
      api.functions.bookings.updateBookingStatus,
      { bookingId, newStatus: "pending_confirmation" }
    );

    expect(result.success).toBe(true);
    expect(result.booking.status).toBe("pending_confirmation");
  });

  it("rejects invalid confirmed → inquiry", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "confirmed");

    await expect(
      asManager.mutation(api.functions.bookings.updateBookingStatus, {
        bookingId,
        newStatus: "inquiry"
      })
    ).rejects.toThrow(/Cannot transition booking from confirmed to inquiry/);
  });

  it("inserts audit log on status change", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "inquiry");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "confirmed",
      reason: "Guest paid deposit"
    });

    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_property", (q) => q.eq("propertyId", seed.propertyId))
        .collect()
    );

    const statusLog = logs.find((l) => l.entityId === bookingId);
    expect(statusLog?.action).toBe("status_change");
    expect(statusLog?.entityType).toBe("booking");
    expect(statusLog?.oldValues).toEqual({ status: "inquiry" });
    expect(statusLog?.newValues).toEqual({
      status: "confirmed",
      reason: "Guest paid deposit"
    });
    expect(statusLog?.actorId).toBe(seed.managerId);
  });

  it("denies access to bookings on another property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(
      t,
      seed,
      "inquiry",
      seed.otherPropertyId
    );

    await expect(
      asManager.mutation(api.functions.bookings.updateBookingStatus, {
        bookingId,
        newStatus: "confirmed"
      })
    ).rejects.toThrow(/Not authorized for this property/);
  });
});

describe("getBookingAuditTrail", () => {
  it("returns status changes newest first", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "inquiry");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "pending_confirmation"
    });
    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "confirmed"
    });

    const trail = await asManager.query(
      api.functions.bookings.getBookingAuditTrail,
      { bookingId }
    );

    expect(trail).toHaveLength(2);
    expect(trail[0]?.newValues).toMatchObject({ status: "confirmed" });
    expect(trail[1]?.newValues).toMatchObject({ status: "pending_confirmation" });
    expect(trail[0]?.actorName).toBe("Test Manager");
  });

  it("scopes audit trail to the booking id", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingA = await insertBooking(t, seed, "inquiry");
    const bookingB = await insertBooking(t, seed, "inquiry");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId: bookingA,
      newStatus: "confirmed"
    });

    const trail = await asManager.query(
      api.functions.bookings.getBookingAuditTrail,
      { bookingId: bookingB }
    );

    expect(trail).toHaveLength(0);
  });
});

describe("getBookingById", () => {
  it("returns denormalized guest and unit fields", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "confirmed");

    const booking = await asManager.query(
      api.functions.bookings.getBookingById,
      { bookingId }
    );

    expect(booking.guestName).toBe("Ada Okonkwo");
    expect(booking.guestPhone).toBe("+2348000000002");
    expect(booking.unitNumber).toBe("101");
    expect(booking.unitType).toBe("room");
    expect(booking.status).toBe("confirmed");
  });
});

describe("state machine edge cases", () => {
  it("records three audit entries for rapid sequential transitions", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "inquiry");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "pending_confirmation"
    });
    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "confirmed"
    });
    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "checked_in"
    });

    const booking = await t.run(async (ctx) => ctx.db.get("booking", bookingId));
    expect(booking?.status).toBe("checked_in");

    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_property", (q) => q.eq("propertyId", seed.propertyId))
        .collect()
    );
    const statusLogs = logs
      .filter((l) => l.entityId === bookingId && l.action === "status_change")
      .sort((a, b) => a.createdAt - b.createdAt);

    expect(statusLogs).toHaveLength(3);
    expect(statusLogs.map((l) => l.newValues?.status)).toEqual([
      "pending_confirmation",
      "confirmed",
      "checked_in"
    ]);
  });

  it("cancels from confirmed state", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "confirmed");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "cancelled"
    });

    const booking = await t.run(async (ctx) => ctx.db.get("booking", bookingId));
    expect(booking?.status).toBe("cancelled");
  });

  it("cancels from checked_in state (emergency override path)", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "checked_in");

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "cancelled"
    });

    const booking = await t.run(async (ctx) => ctx.db.get("booking", bookingId));
    expect(booking?.status).toBe("cancelled");
  });

  it("stores long transition reasons without truncation (no max-length validation yet)", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await insertBooking(t, seed, "inquiry");
    const longReason = "x".repeat(501);

    await asManager.mutation(api.functions.bookings.updateBookingStatus, {
      bookingId,
      newStatus: "confirmed",
      reason: longReason
    });

    const logs = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_property", (q) => q.eq("propertyId", seed.propertyId))
        .collect()
    );
    const entry = logs.find((l) => l.entityId === bookingId);
    expect(entry?.newValues?.reason).toBe(longReason);
  });
});
