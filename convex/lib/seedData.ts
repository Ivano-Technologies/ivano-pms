import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

type SeedCtx = GenericMutationCtx<DataModel>;

export type SeedResult = {
  propertyId: Id<"property">;
  unitCount: number;
  guestCount: number;
  bookingCount: number;
  messageCount: number;
};

export async function clearSeedData(ctx: SeedCtx): Promise<void> {
  for (const row of await ctx.db.query("auditLog").take(500)) {
    await ctx.db.delete("auditLog", row._id);
  }
  for (const row of await ctx.db.query("checklist").take(500)) {
    await ctx.db.delete("checklist", row._id);
  }
  for (const row of await ctx.db.query("occupancySnapshot").take(500)) {
    await ctx.db.delete("occupancySnapshot", row._id);
  }
  for (const row of await ctx.db.query("bookingChannelMessage").take(500)) {
    await ctx.db.delete("bookingChannelMessage", row._id);
  }
  for (const row of await ctx.db.query("booking").take(500)) {
    await ctx.db.delete("booking", row._id);
  }
  for (const row of await ctx.db.query("guest").take(500)) {
    await ctx.db.delete("guest", row._id);
  }
  for (const row of await ctx.db.query("manager").take(500)) {
    await ctx.db.delete("manager", row._id);
  }
  for (const row of await ctx.db.query("unit").take(500)) {
    await ctx.db.delete("unit", row._id);
  }
  for (const row of await ctx.db.query("property").take(500)) {
    await ctx.db.delete("property", row._id);
  }
}

export async function insertDemoData(ctx: SeedCtx): Promise<SeedResult> {
  const now = Date.now();

  const propertyId = await ctx.db.insert("property", {
    name: "Gwarimpa Estate",
    address: "Gwarimpa, Abuja, Nigeria",
    phone: "+2348012345678",
    whatsapp: "+2348012345678",
    currencyCode: "NGN",
    timezone: "Africa/Lagos",
    createdAt: now,
    updatedAt: now
  });

  const unitSpecs: Array<{
    unitNumber: string;
    unitType: "room" | "suite" | "villa" | "studio";
    capacityGuests: number;
    pricePerNightNgn: number;
    amenities: string[];
  }> = [
    {
      unitNumber: "R101",
      unitType: "room",
      capacityGuests: 2,
      pricePerNightNgn: 45000,
      amenities: ["wifi", "ac"]
    },
    {
      unitNumber: "R102",
      unitType: "room",
      capacityGuests: 2,
      pricePerNightNgn: 45000,
      amenities: ["wifi", "ac"]
    },
    {
      unitNumber: "R103",
      unitType: "room",
      capacityGuests: 2,
      pricePerNightNgn: 48000,
      amenities: ["wifi", "ac", "tv"]
    },
    {
      unitNumber: "R104",
      unitType: "room",
      capacityGuests: 3,
      pricePerNightNgn: 52000,
      amenities: ["wifi", "ac"]
    },
    {
      unitNumber: "R105",
      unitType: "room",
      capacityGuests: 2,
      pricePerNightNgn: 46000,
      amenities: ["wifi", "ac"]
    },
    {
      unitNumber: "S201",
      unitType: "suite",
      capacityGuests: 4,
      pricePerNightNgn: 85000,
      amenities: ["wifi", "ac", "kitchen"]
    },
    {
      unitNumber: "S202",
      unitType: "suite",
      capacityGuests: 4,
      pricePerNightNgn: 90000,
      amenities: ["wifi", "ac", "kitchen", "tv"]
    },
    {
      unitNumber: "S203",
      unitType: "suite",
      capacityGuests: 3,
      pricePerNightNgn: 82000,
      amenities: ["wifi", "ac", "kitchen"]
    },
    {
      unitNumber: "V301",
      unitType: "villa",
      capacityGuests: 6,
      pricePerNightNgn: 180000,
      amenities: ["wifi", "ac", "kitchen", "pool"]
    },
    {
      unitNumber: "V302",
      unitType: "villa",
      capacityGuests: 8,
      pricePerNightNgn: 220000,
      amenities: ["wifi", "ac", "kitchen", "pool", "garden"]
    }
  ];

  const unitIds: Id<"unit">[] = [];
  for (const spec of unitSpecs) {
    const id = await ctx.db.insert("unit", {
      propertyId,
      ...spec,
      availabilityStatus: "available",
      createdAt: now,
      updatedAt: now
    });
    unitIds.push(id);
  }

  const guestSpecs = [
    {
      firstName: "Ada",
      lastName: "Okonkwo",
      phone: "+2348011111111",
      idType: "national_id" as const,
      idNumber: "NG-001"
    },
    {
      firstName: "Chidi",
      lastName: "Eze",
      phone: "+2348022222222",
      idType: "passport" as const,
      idNumber: "A12345678"
    },
    {
      firstName: "Fatima",
      lastName: "Bello",
      phone: "+2348033333333",
      idType: "drivers_license" as const,
      idNumber: "DL-998877"
    },
    {
      firstName: "Emeka",
      lastName: "Nwosu",
      phone: "+2348044444444",
      idType: "national_id" as const,
      idNumber: "NG-002"
    },
    {
      firstName: "Zainab",
      lastName: "Yusuf",
      phone: "+2348055555555",
      idType: "passport" as const,
      idNumber: "B87654321"
    },
    {
      firstName: "Tunde",
      lastName: "Adeyemi",
      phone: "+2348066666666",
      idType: "national_id" as const,
      idNumber: "NG-003"
    },
    {
      firstName: "Sarah",
      lastName: "Kamara",
      phone: "+2348077777777",
      idType: "passport" as const,
      idNumber: "C99887766"
    },
    {
      firstName: "Ibrahim",
      lastName: "Musa",
      phone: "+2348088888888",
      idType: "national_id" as const,
      idNumber: "NG-004"
    }
  ];

  const guestIds: Id<"guest">[] = [];
  for (const spec of guestSpecs) {
    const id = await ctx.db.insert("guest", {
      propertyId,
      ...spec,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    });
    guestIds.push(id);
  }

  const bookingSpecs: Array<{
    guestIndex: number;
    unitIndex: number;
    bookingType: "nightly" | "weekly" | "monthly" | "lease";
    checkInDate: string;
    checkOutDate?: string;
    status:
      | "inquiry"
      | "pending_confirmation"
      | "confirmed"
      | "checked_in"
      | "checked_out"
      | "completed"
      | "cancelled";
    sourceChannel: "whatsapp" | "telegram" | "instagram" | "direct";
    totalPriceNgn: number;
  }> = [
    {
      guestIndex: 0,
      unitIndex: 0,
      bookingType: "nightly",
      checkInDate: "2026-07-01",
      checkOutDate: "2026-07-03",
      status: "confirmed",
      sourceChannel: "whatsapp",
      totalPriceNgn: 90000
    },
    {
      guestIndex: 1,
      unitIndex: 5,
      bookingType: "weekly",
      checkInDate: "2026-07-10",
      checkOutDate: "2026-07-17",
      status: "pending_confirmation",
      sourceChannel: "telegram",
      totalPriceNgn: 595000
    },
    {
      guestIndex: 2,
      unitIndex: 8,
      bookingType: "monthly",
      checkInDate: "2026-08-01",
      checkOutDate: "2026-08-31",
      status: "inquiry",
      sourceChannel: "instagram",
      totalPriceNgn: 5400000
    },
    {
      guestIndex: 3,
      unitIndex: 1,
      bookingType: "nightly",
      checkInDate: "2026-06-18",
      checkOutDate: "2026-06-22",
      status: "checked_in",
      sourceChannel: "direct",
      totalPriceNgn: 180000
    },
    {
      guestIndex: 4,
      unitIndex: 2,
      bookingType: "nightly",
      checkInDate: "2026-06-10",
      checkOutDate: "2026-06-12",
      status: "checked_out",
      sourceChannel: "whatsapp",
      totalPriceNgn: 96000
    },
    {
      guestIndex: 5,
      unitIndex: 3,
      bookingType: "nightly",
      checkInDate: "2026-07-20",
      checkOutDate: "2026-07-22",
      status: "cancelled",
      sourceChannel: "whatsapp",
      totalPriceNgn: 104000
    },
    {
      guestIndex: 6,
      unitIndex: 6,
      bookingType: "weekly",
      checkInDate: "2026-06-01",
      checkOutDate: "2026-06-08",
      status: "completed",
      sourceChannel: "telegram",
      totalPriceNgn: 630000
    }
  ];

  for (const spec of bookingSpecs) {
    await ctx.db.insert("booking", {
      propertyId,
      guestId: guestIds[spec.guestIndex]!,
      unitId: unitIds[spec.unitIndex]!,
      bookingType: spec.bookingType,
      checkInDate: spec.checkInDate,
      checkOutDate: spec.checkOutDate,
      adultsCount: 2,
      childrenCount: 0,
      status: spec.status,
      sourceChannel: spec.sourceChannel,
      totalPriceNgn: spec.totalPriceNgn,
      paidNgn: 0,
      createdAt: now,
      updatedAt: now
    });
  }

  const messageSpecs: Array<{
    channel: "whatsapp" | "telegram" | "instagram";
    senderName: string;
    messageText: string;
    senderPhone?: string;
    telegramUserId?: string;
    instagramUserId?: string;
    status: "new" | "reviewed" | "archived";
  }> = [
    {
      channel: "whatsapp",
      senderName: "Tunde Adeyemi",
      senderPhone: "+2348099999999",
      messageText: "Hi, I need a suite for 2 nights from July 15",
      status: "new"
    },
    {
      channel: "telegram",
      senderName: "Sarah K",
      telegramUserId: "tg_user_12345",
      messageText: "Looking for a villa next weekend for 6 guests",
      status: "new"
    },
    {
      channel: "instagram",
      senderName: "Ada Okonkwo",
      instagramUserId: "ig_ada_001",
      messageText: "Do you have a room available July 20-22 for Ada Okonkwo?",
      status: "new"
    },
    {
      channel: "whatsapp",
      senderName: "Chidi Eze",
      senderPhone: "+2348022222222",
      messageText: "Need studio from August 1 for one week please",
      status: "new"
    },
    {
      channel: "telegram",
      senderName: "Fatima Bello",
      telegramUserId: "tg_fatima_99",
      messageText: "Villa for Fatima Bello on July 25, 3 nights",
      status: "new"
    },
    {
      channel: "whatsapp",
      senderName: "Emeka Nwosu",
      senderPhone: "+2348044444444",
      messageText: "Any suite available this weekend?",
      status: "new"
    },
    {
      channel: "instagram",
      senderName: "Zainab Yusuf",
      instagramUserId: "ig_zainab",
      messageText: "Booking inquiry for 4 guests July 10 to July 14",
      status: "new"
    },
    {
      channel: "whatsapp",
      senderName: "Unknown Guest",
      senderPhone: "+2348098765432",
      messageText: "Hello, what are your rates?",
      status: "reviewed"
    },
    {
      channel: "telegram",
      senderName: "Ibrahim",
      telegramUserId: "tg_ibrahim",
      messageText: "Room for 2 nights starting July 18",
      status: "new"
    },
    {
      channel: "whatsapp",
      senderName: "Grace Okafor",
      senderPhone: "+2348010101010",
      messageText: "Suite July 20-22 for Tunde, party of 3",
      status: "new"
    },
    {
      channel: "instagram",
      senderName: "Michael",
      instagramUserId: "ig_michael",
      messageText: "Is the villa free next month?",
      status: "new"
    },
    {
      channel: "telegram",
      senderName: "Amina",
      telegramUserId: "tg_amina",
      messageText: "Need accommodation July 15 for 2 nights, budget room",
      status: "archived"
    }
  ];

  for (const spec of messageSpecs) {
    await ctx.db.insert("bookingChannelMessage", {
      propertyId,
      channel: spec.channel,
      senderName: spec.senderName,
      messageText: spec.messageText,
      senderPhone: spec.senderPhone,
      telegramUserId: spec.telegramUserId,
      instagramUserId: spec.instagramUserId,
      status: spec.status,
      createdAt: now,
      updatedAt: now
    });
  }

  await ctx.db.insert("occupancySnapshot", {
    propertyId,
    snapshotDate: "2026-06-24",
    totalUnits: unitIds.length,
    occupiedUnits: 2,
    occupancyRate: 0.2,
    revenueNgn: 276000,
    bookingSources: { whatsapp: 3, telegram: 2, instagram: 2, direct: 1 },
    createdAt: now
  });

  return {
    propertyId,
    unitCount: unitIds.length,
    guestCount: guestIds.length,
    bookingCount: bookingSpecs.length,
    messageCount: messageSpecs.length
  };
}
