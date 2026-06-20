import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import { assertInternalJobSecret } from "../lib/secrets";

const auditAction = v.union(
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("status_change"),
  v.literal("booking_convert"),
  v.literal("payment_received")
);

const auditEntityType = v.union(
  v.literal("guest"),
  v.literal("booking"),
  v.literal("unit"),
  v.literal("manager"),
  v.literal("checklist")
);

export const getAuditLog = query({
  args: {
    propertyId: v.id("property"),
    entityType: v.optional(auditEntityType)
  },
  returns: v.array(
    v.object({
      _id: v.id("auditLog"),
      _creationTime: v.number(),
      propertyId: v.id("property"),
      action: auditAction,
      entityType: auditEntityType,
      entityId: v.string(),
      oldValues: v.optional(v.any()),
      newValues: v.optional(v.any()),
      actorId: v.optional(v.id("manager")),
      createdAt: v.number()
    })
  ),
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_property_created", (q) =>
        q.eq("propertyId", args.propertyId)
      )
      .take(100);

    if (args.entityType !== undefined) {
      return logs.filter((l) => l.entityType === args.entityType);
    }
    return logs.sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const appendAuditLog = internalMutation({
  args: {
    secret: v.string(),
    propertyId: v.id("property"),
    action: auditAction,
    entityType: auditEntityType,
    entityId: v.string(),
    oldValues: v.optional(v.any()),
    newValues: v.optional(v.any()),
    actorId: v.optional(v.id("manager"))
  },
  returns: v.id("auditLog"),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    return await ctx.db.insert("auditLog", {
      propertyId: args.propertyId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      oldValues: args.oldValues,
      newValues: args.newValues,
      actorId: args.actorId,
      createdAt: Date.now()
    });
  }
});
