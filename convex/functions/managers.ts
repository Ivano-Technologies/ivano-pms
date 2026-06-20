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
      .unique();

    if (existing) {
      if (existing.isDeleted) {
        throw new Error("Manager account deactivated");
      }
      return existing._id;
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

    const manager = await ctx.db
      .query("manager")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!manager || manager.isDeleted) {
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
