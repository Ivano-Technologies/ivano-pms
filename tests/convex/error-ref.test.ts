import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateErrorRef,
  logAndWrapError,
  toRefError,
} from "../../convex/lib/errorRef";
import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager,
} from "./helpers";

afterEach(() => vi.restoreAllMocks());

describe("Convex error refs (IVA-189)", () => {
  it("generates 8 character refs", () => {
    expect(generateErrorRef()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);
  });

  it("marks deliberate ConvexError text as user facing", () => {
    const wrapped = toRefError(
      new ConvexError("Unit already booked for these dates"),
      "K7QM2XWA",
    );
    expect(wrapped.data).toEqual({
      message: "Unit already booked for these dates",
      ref: "K7QM2XWA",
      userFacing: true,
    });
  });

  it("forwards a short plain Error message for classification only, and drops unsafe text", () => {
    expect(toRefError(new Error("Guest not found"), "K7QM2XWA").data).toEqual({
      message: "Guest not found",
      ref: "K7QM2XWA",
      userFacing: false,
    });
    expect(
      toRefError(
        new Error("Document k57abcdefghijklmnopqrstuvwxyz12 missing"),
        "K7QM2XWA",
      ).data,
    ).toEqual({
      ref: "K7QM2XWA",
      userFacing: false,
    });
  });

  it("logs the raw error with the same ref it returns", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const raw = new Error("Ledger mismatch");
    const wrapped = logAndWrapError(raw, "mutation");
    const { ref } = wrapped.data;
    expect(error).toHaveBeenCalledWith(
      JSON.stringify({
        type: "convex_error",
        ref,
        kind: "mutation",
        userFacing: false,
        message: "Ledger mismatch",
      }),
    );
    expect(error).toHaveBeenCalledWith(`[convex_error] ref=${ref}`, raw);
  });

  it("app functions throw a ConvexError carrying the logged ref", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.authUserId);
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
        updatedAt: now,
      }),
    );
    const thrown = await asManager
      .mutation(api.functions.units.updateUnit, {
        unitId: otherUnitId,
        unitNumber: "X",
      })
      .catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(ConvexError);
    const data = (
      thrown as ConvexError<{
        ref: string;
        userFacing: boolean;
        message: string;
      }>
    ).data;
    expect(data.ref).toMatch(/^[A-Z2-9]{8}$/);
    expect(data).toMatchObject({
      userFacing: false,
      message: "Not authorized for this property",
    });
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(`"ref":"${data.ref}"`),
    );
  });
});
