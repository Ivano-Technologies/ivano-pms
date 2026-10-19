import { describe, expect, it, vi } from "vitest";

import type { Id } from "../../convex/_generated/dataModel";
import { api, createTestConvex, seedAuthedManager } from "./helpers";

type T = ReturnType<typeof createTestConvex>;

/** A Convex Auth users row, as Google sign in or the email code would create it. */
async function seedUser(t: T, email: string, verified: boolean): Promise<Id<"users">> {
  return await t.run((ctx) =>
    ctx.db.insert("users", {
      email,
      ...(verified ? { emailVerificationTime: Date.now() } : {})
    })
  );
}

/** A manager row from before Convex Auth: no authUserId. */
async function seedLegacyManager(t: T, propertyId: Id<"property">, email: string) {
  const now = Date.now();
  return await t.run((ctx) =>
    ctx.db.insert("manager", {
      propertyId,
      email,
      fullName: "Legacy Clerk Owner",
      phone: "",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    })
  );
}

const session = (t: T, userId: string, n = 1) => t.withIdentity({ subject: `${userId}|session_${n}` });

async function managerCount(t: T) {
  return await t.run(async (ctx) => (await ctx.db.query("manager").collect()).length);
}

/**
 * IVA-194: with Convex Auth the JWT subject is "userId|sessionId" and the session part changes on
 * every sign in. Manager lookups key on the stable user id (getAuthUserId), and
 * upsertManagerFromAuth only ever links an existing row.
 */
describe("manager authUserId uses the stable Convex Auth user id", () => {
  it("signing in twice reuses the same owner row instead of creating a new one", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const userId = await seedUser(t, "owner@test.com", true);
    await t.run((ctx) => ctx.db.patch("manager", seed.managerId, { authUserId: userId }));
    const before = await managerCount(t);

    const first = await session(t, userId, 1).mutation(api.functions.managers.upsertManagerFromAuth, {});
    const second = await session(t, userId, 2).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(first).toBe(seed.managerId);
    expect(second).toBe(seed.managerId);
    expect(await managerCount(t)).toBe(before);

    const profile = await session(t, userId, 2).query(api.functions.managers.getCurrentManagerProfile, {});
    expect(profile?._id).toBe(seed.managerId);
    const properties = await session(t, userId, 2).query(api.functions.managers.getMyProperties, {});
    expect(properties.map((p) => p.managerId)).toEqual([seed.managerId]);
  });

  it("authed functions find the manager from a session scoped subject", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = t.withIdentity({ subject: `${seed.authUserId}|session_xyz` });
    const units = await asManager.query(api.functions.units.getUnits, {});
    expect(units.length).toBeGreaterThan(0);
  });

  it("accepts a legacy manager row without authUserId", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    await seedLegacyManager(t, seed.propertyId, "legacy@test.com");
    const asManager = t.withIdentity({ subject: `${seed.authUserId}|s1` });
    const profile = await asManager.query(api.functions.managers.getCurrentManagerProfile, {});
    expect(profile?.authUserId).toBe(seed.authUserId);
  });
});

describe("upsertManagerFromAuth claims legacy rows only by verified email (IVA-194)", () => {
  it("claims the one legacy row that matches the verified email, case and spaces ignored", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "  Owner@Hotel.NG ");
    const userId = await seedUser(t, "owner@hotel.ng", true);

    const claimed = await session(t, userId).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(claimed).toBe(legacyId);
    const row = await t.run((ctx) => ctx.db.get("manager", legacyId));
    expect(row?.authUserId).toBe(userId);
    const profile = await session(t, userId, 2).query(api.functions.managers.getCurrentManagerProfile, {});
    expect(profile?._id).toBe(legacyId);
  });

  it("claims nothing when two or more legacy rows match", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const a = await seedLegacyManager(t, seed.propertyId, "dup@hotel.ng");
    const b = await seedLegacyManager(t, seed.otherPropertyId, "DUP@hotel.ng");
    const userId = await seedUser(t, "dup@hotel.ng", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await session(t, userId).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(result).toBeNull();
    for (const id of [a, b]) {
      expect((await t.run((ctx) => ctx.db.get("manager", id)))?.authUserId).toBeUndefined();
    }
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("2 legacy manager rows"));
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("dup@hotel.ng");
    warn.mockRestore();
  });

  it("claims nothing when the email is not verified", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "owner@hotel.ng");
    const userId = await seedUser(t, "owner@hotel.ng", false);

    const result = await session(t, userId).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(result).toBeNull();
    expect((await t.run((ctx) => ctx.db.get("manager", legacyId)))?.authUserId).toBeUndefined();
  });

  it("ignores a client supplied email argument", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "owner@hotel.ng");
    const userId = await seedUser(t, "someone.else@gmail.com", true);
    // The mutation takes no args, so a client email is rejected by the validator.
    await expect(
      session(t, userId).mutation(api.functions.managers.upsertManagerFromAuth, {
        email: "owner@hotel.ng"
      } as unknown as Record<string, never>)
    ).rejects.toThrow();
    expect((await t.run((ctx) => ctx.db.get("manager", legacyId)))?.authUserId).toBeUndefined();
  });

  it("a stranger sign in creates no manager row and gets no role", async () => {
    const t = createTestConvex();
    await seedAuthedManager(t);
    const userId = await seedUser(t, "stranger@gmail.com", true);
    const before = await managerCount(t);

    const result = await session(t, userId).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(result).toBeNull();
    expect(await managerCount(t)).toBe(before);
    expect(await session(t, userId).query(api.functions.managers.getCurrentManagerProfile, {})).toBeNull();
    expect(await session(t, userId).query(api.functions.managers.getMyProperties, {})).toEqual([]);
    await expect(session(t, userId).query(api.functions.units.getUnits, {})).rejects.toThrow();
  });

  it("a second sign in after a claim returns the same row", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "owner@hotel.ng");
    const userId = await seedUser(t, "owner@hotel.ng", true);
    const before = await managerCount(t);

    const first = await session(t, userId, 1).mutation(api.functions.managers.upsertManagerFromAuth, {});
    const second = await session(t, userId, 2).mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(first).toBe(legacyId);
    expect(second).toBe(legacyId);
    expect(await managerCount(t)).toBe(before);
  });

  it("claims from the users record when the token identity carries no email", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "owner@hotel.ng");
    const userId = await seedUser(t, "owner@hotel.ng", true);
    // Convex Auth 0.0.90 tokens carry only the userId|sessionId subject.
    const identity = t.withIdentity({ subject: `${userId}|session_1` });

    const claimed = await identity.mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(claimed).toBe(legacyId);
  });

  it("never trusts identity.email: a matching token email with a different users record claims nothing", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const legacyId = await seedLegacyManager(t, seed.propertyId, "owner@hotel.ng");
    const userId = await seedUser(t, "someone.else@gmail.com", true);
    const identity = t.withIdentity({
      subject: `${userId}|session_1`,
      email: "owner@hotel.ng",
      emailVerified: true
    });

    const result = await identity.mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(result).toBeNull();
    expect((await t.run((ctx) => ctx.db.get("manager", legacyId)))?.authUserId).toBeUndefined();
  });
});
