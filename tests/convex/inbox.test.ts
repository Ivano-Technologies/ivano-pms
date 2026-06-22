import { describe, expect, it } from "vitest";

import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

async function seedMessage(
  t: ReturnType<typeof createTestConvex>,
  propertyId: string,
  overrides: Partial<{
    status: "new" | "reviewed" | "converted" | "archived";
    senderName: string;
    messageText: string;
  }> = {}
) {
  const now = Date.now();
  return await t.run(async (ctx) =>
    ctx.db.insert("bookingChannelMessage", {
      propertyId: propertyId as never,
      channel: "whatsapp",
      senderName: overrides.senderName ?? "Test Sender",
      messageText:
        overrides.messageText ?? "I need a room for July 1 to July 3",
      status: overrides.status ?? "new",
      createdAt: now,
      updatedAt: now
    })
  );
}

describe("getChannelMessages", () => {
  it("returns 'new' messages for the manager property", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    await seedMessage(t, seed.propertyId, { status: "new" });
    await seedMessage(t, seed.propertyId, { status: "reviewed" });

    const messages = await asManager.query(
      api.functions.channelMessages.getChannelMessages,
      { status: "new" }
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]?.status).toBe("new");
  });
});

describe("markMessageReviewed", () => {
  it("sets status='reviewed'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const messageId = await seedMessage(t, seed.propertyId, { status: "new" });

    await asManager.mutation(api.functions.channelMessages.markMessageReviewed, {
      messageId
    });

    const msg = await t.run(async (ctx) =>
      ctx.db.get("bookingChannelMessage", messageId)
    );
    expect(msg?.status).toBe("reviewed");
  });
});

describe("markMessageNew", () => {
  it("sets status back to 'new'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const messageId = await seedMessage(t, seed.propertyId, { status: "reviewed" });

    await asManager.mutation(api.functions.channelMessages.markMessageNew, {
      messageId
    });

    const msg = await t.run(async (ctx) =>
      ctx.db.get("bookingChannelMessage", messageId)
    );
    expect(msg?.status).toBe("new");
  });
});

describe("archiveMessage", () => {
  it("sets status='archived'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const messageId = await seedMessage(t, seed.propertyId, { status: "reviewed" });

    await asManager.mutation(api.functions.channelMessages.archiveMessage, {
      messageId
    });

    const msg = await t.run(async (ctx) =>
      ctx.db.get("bookingChannelMessage", messageId)
    );
    expect(msg?.status).toBe("archived");
  });
});

describe("unarchiveMessage", () => {
  it("restores status to 'reviewed'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const messageId = await seedMessage(t, seed.propertyId, { status: "archived" });

    await asManager.mutation(api.functions.channelMessages.unarchiveMessage, {
      messageId
    });

    const msg = await t.run(async (ctx) =>
      ctx.db.get("bookingChannelMessage", messageId)
    );
    expect(msg?.status).toBe("reviewed");
  });
});

describe("convertChannelMessageToBooking", () => {
  it("creates a booking and sets message.status='converted'", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const messageId = await seedMessage(t, seed.propertyId, { status: "new" });

    const bookingId = await asManager.mutation(
      api.functions.channelMessages.convertChannelMessageToBooking,
      {
        messageId,
        guestId: seed.guestId,
        unitId: seed.unitId,
        checkInDate: "2026-08-01",
        checkOutDate: "2026-08-03",
        bookingType: "nightly",
        totalPriceNgn: 50_000
      }
    );

    expect(bookingId).toBeTruthy();

    const msg = await t.run(async (ctx) =>
      ctx.db.get("bookingChannelMessage", messageId)
    );
    expect(msg?.status).toBe("converted");
    expect(msg?.bookingId).toBe(bookingId);

    const booking = await t.run(async (ctx) =>
      ctx.db.get("booking", bookingId)
    );
    expect(booking?.propertyId).toBe(seed.propertyId);
    expect(booking?.status).toBe("pending_confirmation");
  });
});
