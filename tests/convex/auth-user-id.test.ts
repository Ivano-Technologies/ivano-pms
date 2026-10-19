import { describe, expect, it } from "vitest";

import { api, createTestConvex, seedAuthedManager } from "./helpers";

/**
 * IVA-194: with Convex Auth the JWT subject is "userId|sessionId" and the session part changes on
 * every sign in. Manager lookups and creation must key on the stable user id (getAuthUserId).
 */
describe("manager authUserId uses the stable Convex Auth user id", () => {
  it("signing in twice reuses the same owner row instead of creating a new one", async () => {
    const t = createTestConvex();
    await seedAuthedManager(t);
    const firstSession = t.withIdentity({ subject: "user_new_owner|session_1", email: "owner@test.com" });
    const secondSession = t.withIdentity({ subject: "user_new_owner|session_2", email: "owner@test.com" });

    const first = await firstSession.mutation(api.functions.managers.upsertManagerFromAuth, {});
    const second = await secondSession.mutation(api.functions.managers.upsertManagerFromAuth, {});
    expect(second).toBe(first);

    const rows = await t.run((ctx) =>
      ctx.db
        .query("manager")
        .withIndex("by_auth_user", (q) => q.eq("authUserId", "user_new_owner"))
        .collect()
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.authUserId).toBe("user_new_owner");

    const profile = await secondSession.query(api.functions.managers.getCurrentManagerProfile, {});
    expect(profile?._id).toBe(first);
    const properties = await secondSession.query(api.functions.managers.getMyProperties, {});
    expect(properties.map((p) => p.managerId)).toEqual([first]);
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
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("manager", {
        propertyId: seed.propertyId,
        email: "legacy@test.com",
        fullName: "Legacy Clerk Owner",
        phone: "",
        role: "owner",
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
    });
    const asManager = t.withIdentity({ subject: `${seed.authUserId}|s1` });
    const profile = await asManager.query(api.functions.managers.getCurrentManagerProfile, {});
    expect(profile?.authUserId).toBe(seed.authUserId);
  });
});
