import { ConvexError, v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import {
  calcImportTotalPriceNgn,
  parseBulkImportRow,
  type BulkImportRawRow
} from "../lib/bulkImport";
import { checkBookingOverlap } from "../lib/bookingOverlap";
import { authedMutation } from "../lib/customFunctions";

const MAX_ROWS = 500;

const rawRow = v.object({
  rowNumber: v.number(),
  guestName: v.string(),
  phone: v.string(),
  email: v.string(),
  checkInDate: v.string(),
  checkOutDate: v.string(),
  unitNumber: v.string(),
  status: v.string()
});

const skippedRow = v.object({
  rowNumber: v.number(),
  reason: v.string()
});

export const bulkImportBookings = authedMutation({
  args: {
    rows: v.array(rawRow)
  },
  returns: v.object({
    importedCount: v.number(),
    skipped: v.array(skippedRow),
    importedBookingIds: v.array(v.id("booking"))
  }),
  handler: async (ctx, args) => {
    if (args.rows.length > MAX_ROWS) {
      throw new Error(`Import limited to ${MAX_ROWS} rows per upload`);
    }

    const propertyId = ctx.manager.propertyId;
    const units = await ctx.db
      .query("unit")
      .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
      .collect();

    const unitByNumber = new Map(
      units.map((u) => [u.unitNumber.trim().toLowerCase(), u])
    );

    const skipped: Array<{ rowNumber: number; reason: string }> = [];
    const importedBookingIds: Id<"booking">[] = [];
    let importedCount = 0;

    for (const raw of args.rows) {
      const parsed = parseBulkImportRow(raw as BulkImportRawRow);
      if (!parsed.ok) {
        skipped.push({ rowNumber: raw.rowNumber, reason: parsed.reason });
        continue;
      }

      const row = parsed.row;
      const unit = unitByNumber.get(row.unitNumber.toLowerCase());
      if (!unit) {
        skipped.push({
          rowNumber: row.rowNumber,
          reason: `Unit not found: ${row.unitNumber}`
        });
        continue;
      }

      let guestId: Id<"guest">;
      const existingGuest = await ctx.db
        .query("guest")
        .withIndex("by_property_phone", (q) =>
          q.eq("propertyId", propertyId).eq("phone", row.phone)
        )
        .first();

      const now = Date.now();

      if (existingGuest && !existingGuest.isDeleted) {
        guestId = existingGuest._id;
        if (row.email && row.email !== existingGuest.email) {
          await ctx.db.patch("guest", guestId, {
            email: row.email,
            updatedAt: now
          });
        }
      } else {
        guestId = await ctx.db.insert("guest", {
          propertyId,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email,
          idType: "other",
          idNumber: row.idNumber,
          isDeleted: false,
          createdAt: now,
          updatedAt: now
        });
      }

      try {
        await checkBookingOverlap(
          ctx,
          unit._id,
          row.checkInDate,
          row.checkOutDate
        );
      } catch (error) {
        const reason =
          error instanceof ConvexError
            ? String(error.message)
            : error instanceof Error
              ? error.message
              : "Booking conflict";
        skipped.push({ rowNumber: row.rowNumber, reason });
        continue;
      }

      const totalPriceNgn = calcImportTotalPriceNgn(
        row.checkInDate,
        row.checkOutDate,
        unit.pricePerNightNgn
      );

      const bookingId = await ctx.db.insert("booking", {
        propertyId,
        guestId,
        unitId: unit._id,
        bookingType: "nightly",
        checkInDate: row.checkInDate,
        checkOutDate: row.checkOutDate,
        adultsCount: 1,
        childrenCount: 0,
        status: row.status,
        sourceChannel: "direct",
        totalPriceNgn,
        paidNgn: 0,
        createdAt: now,
        updatedAt: now
      });

      importedBookingIds.push(bookingId);
      importedCount += 1;
    }

    return { importedCount, skipped, importedBookingIds };
  }
});
