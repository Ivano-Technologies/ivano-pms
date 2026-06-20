import { v } from "convex/values";

import { authedMutation, authedQuery } from "../lib/customFunctions";

const idType = v.union(
  v.literal("passport"),
  v.literal("drivers_license"),
  v.literal("national_id"),
  v.literal("other")
);

export const getGuests = authedQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("guest"),
      _creationTime: v.number(),
      propertyId: v.id("property"),
      firstName: v.string(),
      lastName: v.string(),
      email: v.optional(v.string()),
      phone: v.string(),
      whatsapp: v.optional(v.string()),
      telegramId: v.optional(v.string()),
      instagramHandle: v.optional(v.string()),
      idType,
      idNumber: v.string(),
      isDeleted: v.boolean(),
      deletedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number()
    })
  ),
  handler: async (ctx) => {
    const guests = await ctx.db
      .query("guest")
      .withIndex("by_property", (q) =>
        q.eq("propertyId", ctx.manager.propertyId)
      )
      .take(100);
    return guests.filter((g) => !g.isDeleted);
  }
});

export const createGuest = authedMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    idType: idType,
    idNumber: v.string(),
    email: v.optional(v.string()),
    whatsapp: v.optional(v.string())
  },
  returns: v.id("guest"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("guest", {
      propertyId: ctx.manager.propertyId,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      email: args.email,
      whatsapp: args.whatsapp,
      idType: args.idType,
      idNumber: args.idNumber,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
  }
});
