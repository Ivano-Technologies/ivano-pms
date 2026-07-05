import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

import {
  parseBulkImportRow,
  splitGuestName
} from "../../convex/lib/bulkImport";

describe("bulk import parsing", () => {
  it("splits guest_name on first space", () => {
    expect(splitGuestName("Ada Okonkwo")).toEqual({
      firstName: "Ada",
      lastName: "Okonkwo"
    });
    expect(splitGuestName("Prince")).toEqual({
      firstName: "Prince",
      lastName: "."
    });
  });

  it("rejects empty guest name", () => {
    const result = parseBulkImportRow({
      rowNumber: 2,
      guestName: "  ",
      phone: "+2348011111111",
      email: "",
      checkInDate: "2025-08-01",
      checkOutDate: "2025-08-03",
      unitNumber: "101",
      status: "inquiry"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/guest name/i);
    }
  });

  it("rejects missing phone", () => {
    const result = parseBulkImportRow({
      rowNumber: 3,
      guestName: "Ada Okonkwo",
      phone: "",
      email: "ada@example.com",
      checkInDate: "2025-08-01",
      checkOutDate: "2025-08-03",
      unitNumber: "101",
      status: "confirmed"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/phone/i);
    }
  });

  it("rejects invalid status", () => {
    const result = parseBulkImportRow({
      rowNumber: 4,
      guestName: "Ada Okonkwo",
      phone: "+2348011111111",
      email: "",
      checkInDate: "2025-08-01",
      checkOutDate: "2025-08-03",
      unitNumber: "101",
      status: "checked_in"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/status/i);
    }
  });
});

describe("bulkImportBookings mutation", () => {
  it("imports valid rows and creates guest with IMPORT id defaults", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const result = await asManager.mutation(
      api.functions.bulkImport.bulkImportBookings,
      {
        rows: [
          {
            rowNumber: 2,
            guestName: "Chidi Eze",
            phone: "+2348099990001",
            email: "chidi@example.com",
            checkInDate: "2026-08-10",
            checkOutDate: "2026-08-12",
            unitNumber: "101",
            status: "inquiry"
          }
        ]
      }
    );

    expect(result.importedCount).toBe(1);
    expect(result.skipped).toHaveLength(0);

    const guests = await asManager.query(api.functions.guests.getGuests, {});
    const guest = guests.find((g) => g.phone === "+2348099990001");
    expect(guest).toMatchObject({
      firstName: "Chidi",
      lastName: "Eze",
      idType: "other",
      idNumber: "IMPORT-2",
      email: "chidi@example.com"
    });

    const bookings = await asManager.query(api.functions.bookings.getBookings, {});
    const booking = bookings.find((b) => b.guestId === guest?._id);
    expect(booking).toMatchObject({
      unitId: seed.unitId,
      checkInDate: "2026-08-10",
      checkOutDate: "2026-08-12",
      status: "inquiry",
      sourceChannel: "direct",
      totalPriceNgn: 50_000
    });
  });

  it("reuses existing guest by phone", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const result = await asManager.mutation(
      api.functions.bulkImport.bulkImportBookings,
      {
        rows: [
          {
            rowNumber: 2,
            guestName: "Ada Okonkwo",
            phone: "+2348000000002",
            email: "",
            checkInDate: "2026-09-01",
            checkOutDate: "2026-09-02",
            unitNumber: "101",
            status: "confirmed"
          }
        ]
      }
    );

    expect(result.importedCount).toBe(1);
    const guests = await asManager.query(api.functions.guests.getGuests, {});
    const adaGuests = guests.filter((g) => g.phone === "+2348000000002");
    expect(adaGuests).toHaveLength(1);
    expect(adaGuests[0]?._id).toBe(seed.guestId);
  });

  it("skips unknown unit with reason", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const result = await asManager.mutation(
      api.functions.bulkImport.bulkImportBookings,
      {
        rows: [
          {
            rowNumber: 2,
            guestName: "Ngozi Bello",
            phone: "+2348099990002",
            email: "",
            checkInDate: "2026-08-01",
            checkOutDate: "2026-08-03",
            unitNumber: "999",
            status: "inquiry"
          }
        ]
      }
    );

    expect(result.importedCount).toBe(0);
    expect(result.skipped).toEqual([
      { rowNumber: 2, reason: "Unit not found: 999" }
    ]);
  });

  it("partial import: valid rows succeed, overlap and invalid rows skipped", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await asManager.mutation(api.functions.bookings.createBooking, {
      guestId: seed.guestId,
      unitId: seed.unitId,
      checkInDate: "2026-10-01",
      checkOutDate: "2026-10-05",
      bookingType: "nightly",
      sourceChannel: "direct",
      totalPriceNgn: 100_000,
      status: "confirmed"
    });

    const result = await asManager.mutation(
      api.functions.bulkImport.bulkImportBookings,
      {
        rows: [
          {
            rowNumber: 2,
            guestName: "Good Guest",
            phone: "+2348099990003",
            email: "",
            checkInDate: "2026-11-01",
            checkOutDate: "2026-11-03",
            unitNumber: "101",
            status: "inquiry"
          },
          {
            rowNumber: 3,
            guestName: "Overlap Guest",
            phone: "+2348099990004",
            email: "",
            checkInDate: "2026-10-03",
            checkOutDate: "2026-10-06",
            unitNumber: "101",
            status: "confirmed"
          },
          {
            rowNumber: 4,
            guestName: "Bad Guest",
            phone: "",
            email: "",
            checkInDate: "2026-12-01",
            checkOutDate: "2026-12-02",
            unitNumber: "101",
            status: "inquiry"
          }
        ]
      }
    );

    expect(result.importedCount).toBe(1);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        { rowNumber: 3, reason: "Unit already booked for these dates" },
        { rowNumber: 4, reason: expect.stringMatching(/phone/i) }
      ])
    );
  });
});
