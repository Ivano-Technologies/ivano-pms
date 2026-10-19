import { v } from "convex/values";

import {
  signedInMutation,
  signedInQuery,
  optionalAuthQuery
} from "../lib/customFunctions";

/** Trimmed, lower case email for matching. */
function normalizeEmail(email: string | undefined | null): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * IVA-194: link the signed-in Convex Auth user to their manager row. Never creates a row.
 *
 * 1. A row already keyed on this user's stable id (getAuthUserId) wins.
 * 2. Otherwise claim a legacy row (no authUserId, from before Convex Auth) only when exactly one
 *    non-deleted row matches the user's verified email. The email comes from the Convex Auth users
 *    record (email plus emailVerificationTime, set by Google sign in and by the email code), never
 *    from client args.
 * 3. Otherwise return null: the user has no access yet and the app shows "No access yet".
 */
export const upsertManagerFromAuth = signedInMutation({
  args: {},
  returns: v.union(v.id("manager"), v.null()),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", ctx.authUserId))
      .take(10);
    const active = existing.find((m) => !m.isDeleted);
    if (active) {
      return active._id;
    }

    const userId = ctx.db.normalizeId("users", ctx.authUserId);
    const user = userId ? await ctx.db.get("users", userId) : null;
    const verifiedEmail =
      user && user.emailVerificationTime !== undefined ? normalizeEmail(user.email) : "";
    if (!verifiedEmail) {
      return null;
    }

    const legacy = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", undefined))
      .take(500);
    const matches = legacy.filter(
      (m) => !m.isDeleted && normalizeEmail(m.email) === verifiedEmail
    );

    if (matches.length === 1) {
      const row = matches[0]!;
      await ctx.db.patch("manager", row._id, {
        authUserId: ctx.authUserId,
        updatedAt: Date.now()
      });
      return row._id;
    }

    if (matches.length > 1) {
      console.warn(
        `[managers] upsertManagerFromAuth: ${matches.length} legacy manager rows match one verified email; not claiming any`
      );
    }
    return null;
  }
});

export const getCurrentManagerProfile = optionalAuthQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("manager"),
      propertyId: v.id("property"),
      authUserId: v.optional(v.string()),
      email: v.string(),
      fullName: v.string(),
      phone: v.string(),
      role: v.union(
        v.literal("owner"),
        v.literal("manager"),
        v.literal("staff")
      )
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const authUserId = ctx.authUserId;
    if (!ctx.identity || !authUserId) {
      return null;
    }

    const managers = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
      .take(10);

    const manager = managers.find((m) => !m.isDeleted);

    if (!manager) {
      return null;
    }

    return {
      _id: manager._id,
      propertyId: manager.propertyId,
      authUserId: manager.authUserId,
      email: manager.email,
      fullName: manager.fullName,
      phone: manager.phone,
      role: manager.role
    };
  }
});

const propertySummary = v.object({
  _id: v.id("property"),
  name: v.string(),
  address: v.string(),
  managerId: v.id("manager"),
  role: v.union(
    v.literal("owner"),
    v.literal("manager"),
    v.literal("staff")
  )
});

export const getMyProperties = signedInQuery({
  args: {},
  returns: v.array(propertySummary),
  handler: async (ctx) => {
    const managers = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", ctx.authUserId))
      .take(10);

    const results = [];
    for (const manager of managers) {
      if (manager.isDeleted) continue;
      const property = await ctx.db.get("property", manager.propertyId);
      if (!property) continue;
      results.push({
        _id: property._id,
        name: property.name,
        address: property.address,
        managerId: manager._id,
        role: manager.role
      });
    }

    return results;
  }
});
