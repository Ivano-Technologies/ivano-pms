import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const unitType = v.union(
  v.literal("room"),
  v.literal("suite"),
  v.literal("villa"),
  v.literal("studio")
);

const availabilityStatus = v.union(
  v.literal("available"),
  v.literal("occupied"),
  v.literal("maintenance"),
  v.literal("reserved")
);

const idType = v.union(
  v.literal("passport"),
  v.literal("drivers_license"),
  v.literal("national_id"),
  v.literal("other")
);

const bookingType = v.union(
  v.literal("nightly"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("lease")
);

const bookingStatus = v.union(
  v.literal("inquiry"),
  v.literal("pending_confirmation"),
  v.literal("confirmed"),
  v.literal("checked_in"),
  v.literal("checked_out"),
  v.literal("completed"),
  v.literal("cancelled")
);

const sourceChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram"),
  v.literal("direct"),
  v.literal("phone"),
  v.literal("walk_in")
);

const messageChannel = v.union(
  v.literal("whatsapp"),
  v.literal("telegram"),
  v.literal("instagram")
);

const messageStatus = v.union(
  v.literal("new"),
  v.literal("reviewed"),
  v.literal("converted"),
  v.literal("archived")
);

const managerRole = v.union(
  v.literal("owner"),
  v.literal("manager"),
  v.literal("staff")
);

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

export default defineSchema({
  property: defineTable({
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    whatsapp: v.string(),
    currencyCode: v.literal("NGN"),
    timezone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number()
  }),

  unit: defineTable({
    propertyId: v.id("property"),
    unitNumber: v.string(),
    unitType,
    capacityGuests: v.number(),
    pricePerNightNgn: v.number(),
    amenities: v.array(v.string()),
    availabilityStatus,
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_property_availability", ["propertyId", "availabilityStatus"]),

  guest: defineTable({
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
    notes: v.optional(v.string()),
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_property_phone", ["propertyId", "phone"]),

  booking: defineTable({
    propertyId: v.id("property"),
    guestId: v.id("guest"),
    unitId: v.id("unit"),
    bookingType,
    checkInDate: v.string(),
    checkOutDate: v.optional(v.string()),
    adultsCount: v.number(),
    childrenCount: v.number(),
    status: bookingStatus,
    sourceChannel,
    notes: v.optional(v.string()),
    totalPriceNgn: v.number(),
    paidNgn: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_property_status_check_in", ["propertyId", "status", "checkInDate"])
    .index("by_property_source_created", ["propertyId", "sourceChannel", "createdAt"])
    .index("by_unit", ["unitId"]),

  bookingChannelMessage: defineTable({
    propertyId: v.id("property"),
    bookingId: v.optional(v.id("booking")),
    channel: messageChannel,
    senderPhone: v.optional(v.string()),
    telegramUserId: v.optional(v.string()),
    instagramUserId: v.optional(v.string()),
    senderName: v.string(),
    messageText: v.string(),
    extractedCheckIn: v.optional(v.string()),
    extractedCheckOut: v.optional(v.string()),
    extractedGuestNames: v.optional(v.array(v.string())),
    extractedUnitType: v.optional(v.string()),
    status: messageStatus,
    managerId: v.optional(v.id("manager")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_property_status_created", ["propertyId", "status", "createdAt"]),

  // SECURITY TODO (Week 6): encrypt accessToken at rest before production.
  channelToken: defineTable({
    propertyId: v.id("property"),
    channel: messageChannel,
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    phoneNumberId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_property_channel", ["propertyId", "channel"]),

  manager: defineTable({
    propertyId: v.id("property"),
    clerkUserId: v.string(),
    email: v.string(),
    fullName: v.string(),
    phone: v.string(),
    role: managerRole,
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_clerk_user", ["clerkUserId"]),

  checklist: defineTable({
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
  })
    .index("by_property", ["propertyId"])
    .index("by_booking", ["bookingId"]),

  occupancySnapshot: defineTable({
    propertyId: v.id("property"),
    snapshotDate: v.string(),
    totalUnits: v.number(),
    occupiedUnits: v.number(),
    occupancyRate: v.number(),
    revenueNgn: v.number(),
    bookingSources: v.object({
      whatsapp: v.number(),
      telegram: v.number(),
      instagram: v.number(),
      direct: v.number()
    }),
    createdAt: v.number()
  }).index("by_property_date", ["propertyId", "snapshotDate"]),

  auditLog: defineTable({
    propertyId: v.id("property"),
    action: auditAction,
    entityType: auditEntityType,
    entityId: v.string(),
    oldValues: v.optional(v.any()),
    newValues: v.optional(v.any()),
    actorId: v.optional(v.id("manager")),
    createdAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_property_created", ["propertyId", "createdAt"])
});
