import { v } from "convex/values";

import {
  signedInMutation,
  signedInQuery,
  optionalAuthQuery
} from "../lib/customFunctions";

export const upsertManagerFromAuth = signedInMutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string())
  },
  returns: v.id("manager"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", ctx.identity.subject))
      .take(10);

    const active = existing.find((m) => !m.isDeleted);

    if (active) {
      return active._id;
    }

    const property = await ctx.db.query("property").first();
    if (!property) {
      throw new Error(
        "No property exists in this Convex deployment. On a new production environment, run once: npx convex run seed:seedDemoData --prod (or add a property via onboarding)."
      );
    }

    const email = (args.email ?? ctx.identity.email ?? "").trim();
    const fullName = (args.fullName ?? ctx.identity.name ?? "Manager").trim() || "Manager";
    const now = Date.now();
    return await ctx.db.insert("manager", {
      propertyId: property._id,
      authUserId: ctx.identity.subject,
      email,
      fullName,
      phone: args.phone ?? "",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const getCurrentManagerProfile = optionalAuthQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("manager"),
      propertyId: v.id("property"),
      authUserId: v.string(),
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
    if (!ctx.identity) {
      return null;
    }

    const managers = await ctx.db
      .query("manager")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", ctx.identity!.subject))
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
      .withIndex("by_auth_user", (q) => q.eq("authUserId", ctx.identity.subject))
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
