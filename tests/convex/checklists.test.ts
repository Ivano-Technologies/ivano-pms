import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

async function seedBooking(t: ReturnType<typeof createTestConvex>, seed: Awaited<ReturnType<typeof seedAuthedManager>>) {
  const now = Date.now();
  return await t.run(async (ctx) =>
    ctx.db.insert("booking", {
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
    })
  );
}

describe("checklists", () => {
  it("returns empty list for booking with no checklist items", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await seedBooking(t, seed);

    const items = await asManager.query(
      api.functions.checklists.getChecklistsByBooking,
      { bookingId }
    );

    expect(items).toEqual([]);
  });

  it("creates a checklist item", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await seedBooking(t, seed);

    const id = await asManager.mutation(api.functions.checklists.createChecklist, {
      bookingId,
      taskType: "cleaning",
      taskDescription: "Deep clean suite",
      dueDate: "2026-07-03"
    });

    expect(id).toBeTruthy();
  });

  it("lists checklist items by booking", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await seedBooking(t, seed);

    await asManager.mutation(api.functions.checklists.createChecklist, {
      bookingId,
      taskType: "cleaning",
      taskDescription: "Deep clean suite",
      dueDate: "2026-07-03"
    });

    const items = await asManager.query(
      api.functions.checklists.getChecklistsByBooking,
      { bookingId }
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe("pending");
  });

  it("updates checklist status", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await seedBooking(t, seed);

    const checklistId = await asManager.mutation(
      api.functions.checklists.createChecklist,
      {
        bookingId,
        taskType: "maintenance",
        taskDescription: "Fix AC",
        dueDate: "2026-07-02"
      }
    );

    const updated = await asManager.mutation(
      api.functions.checklists.updateChecklistStatus,
      { checklistId, status: "completed" }
    );

    expect(updated.status).toBe("completed");
  });

  it("deletes a checklist item", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const bookingId = await seedBooking(t, seed);

    const checklistId = await asManager.mutation(
      api.functions.checklists.createChecklist,
      {
        bookingId,
        taskType: "follow_up",
        taskDescription: "Call guest",
        dueDate: "2026-07-04"
      }
    );

    await asManager.mutation(api.functions.checklists.deleteChecklist, {
      checklistId
    });

    const items = await asManager.query(
      api.functions.checklists.getChecklistsByBooking,
      { bookingId }
    );

    expect(items).toHaveLength(0);
  });

  it("rejects checklist access for another property booking", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const otherBookingId = await t.run(async (ctx) =>
      ctx.db.insert("booking", {
        propertyId: seed.otherPropertyId,
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
      })
    );

    await expect(
      asManager.query(api.functions.checklists.getChecklistsByBooking, {
        bookingId: otherBookingId
      })
    ).rejects.toThrow(/Not authorized/);
  });

  it("rejects create when booking not found", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    const fakeBookingId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("booking", {
        propertyId: seed.otherPropertyId,
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
      await ctx.db.delete("booking", id);
      return id;
    });

    await expect(
      asManager.mutation(api.functions.checklists.createChecklist, {
        bookingId: fakeBookingId,
        taskType: "cleaning",
        taskDescription: "Test",
        dueDate: "2026-07-01"
      })
    ).rejects.toThrow(/Booking not found/);
  });
});
