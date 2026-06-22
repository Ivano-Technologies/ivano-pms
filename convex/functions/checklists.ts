import { v } from "convex/values";

import { assertPropertyAccess } from "../lib/auth";
import { authedMutation, authedQuery } from "../lib/customFunctions";

const taskType = v.union(
  v.literal("guest_checkin"),
  v.literal("guest_checkout"),
  v.literal("cleaning"),
  v.literal("maintenance"),
  v.literal("follow_up")
);

const checklistStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

const checklistDoc = v.object({
  _id: v.id("checklist"),
  _creationTime: v.number(),
  propertyId: v.id("property"),
  bookingId: v.id("booking"),
  unitId: v.id("unit"),
  taskType,
  taskDescription: v.string(),
  dueDate: v.string(),
  assignedTo: v.optional(v.id("manager")),
  status: checklistStatus,
  createdAt: v.number(),
  updatedAt: v.number()
});

export const getChecklistsByBooking = authedQuery({
  args: {
    bookingId: v.id("booking")
  },
  returns: v.array(checklistDoc),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    return await ctx.db
      .query("checklist")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .take(50);
  }
});

export const createChecklist = authedMutation({
  args: {
    bookingId: v.id("booking"),
    taskType,
    taskDescription: v.string(),
    dueDate: v.string(),
    assignedTo: v.optional(v.id("manager"))
  },
  returns: v.id("checklist"),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get("booking", args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    assertPropertyAccess(ctx.manager, booking.propertyId);

    const now = Date.now();
    return await ctx.db.insert("checklist", {
      propertyId: booking.propertyId,
      bookingId: args.bookingId,
      unitId: booking.unitId,
      taskType: args.taskType,
      taskDescription: args.taskDescription.trim(),
      dueDate: args.dueDate,
      assignedTo: args.assignedTo,
      status: "pending",
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateChecklistStatus = authedMutation({
  args: {
    checklistId: v.id("checklist"),
    status: checklistStatus
  },
  returns: checklistDoc,
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get("checklist", args.checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    assertPropertyAccess(ctx.manager, checklist.propertyId);

    const now = Date.now();
    await ctx.db.patch("checklist", args.checklistId, {
      status: args.status,
      updatedAt: now
    });

    const updated = await ctx.db.get("checklist", args.checklistId);
    if (!updated) {
      throw new Error("Checklist not found");
    }
    return updated;
  }
});

export const deleteChecklist = authedMutation({
  args: {
    checklistId: v.id("checklist")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get("checklist", args.checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    assertPropertyAccess(ctx.manager, checklist.propertyId);

    await ctx.db.delete("checklist", args.checklistId);
    return null;
  }
});
