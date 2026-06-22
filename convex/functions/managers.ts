import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const upsertManagerFromClerk = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    phone: v.optional(v.string())
  },
  returns: v.id("manager"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("manager")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .take(10);

    const active = existing.find((m) => !m.isDeleted);

    if (active) {
      return active._id;
    }

    const property = await ctx.db.query("property").first();
    if (!property) {
      throw new Error("No property configured. Run seed first.");
    }

    const now = Date.now();
    return await ctx.db.insert("manager", {
      propertyId: property._id,
      clerkUserId: identity.subject,
      email: args.email,
      fullName: args.fullName,
      phone: args.phone ?? "",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const getCurrentManagerProfile = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("manager"),
      propertyId: v.id("property"),
      clerkUserId: v.string(),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const managers = await ctx.db
      .query("manager")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .take(10);

    const manager = managers.find((m) => !m.isDeleted);

    if (!manager) {
      return null;
    }

    return {
      _id: manager._id,
      propertyId: manager.propertyId,
      clerkUserId: manager.clerkUserId,
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

export const getMyProperties = query({
  args: {},
  returns: v.array(propertySummary),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const managers = await ctx.db
      .query("manager")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
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
