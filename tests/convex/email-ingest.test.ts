import { beforeEach, describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

import { formatInboundEmailAddress } from "../../convex/lib/emailRouting";

const INTERNAL_SECRET = "test-internal-secret";

beforeEach(() => {
  process.env.INTERNAL_JOB_SECRET = INTERNAL_SECRET;
});

describe("email inbound ingestion (6.2.2)", () => {
  it("ingests email into unified inbox thread by property slug", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    await t.run(async (ctx) => {
      await ctx.db.patch("property", seed.propertyId, {
        slug: "gwarimpa-estate",
        updatedAt: Date.now()
      });
    });

    const asManager = authedClient(t, seed.clerkUserId);
    const toAddress = formatInboundEmailAddress("gwarimpa-estate");

    const messageId = await t.mutation(
      internal.functions.email.ingestInboundEmailInternal,
      {
        secret: INTERNAL_SECRET,
        toAddress,
        fromAddress: "guest@example.com",
        fromName: "Ada Guest",
        subject: "Booking inquiry",
        textBody: "Do you have a room for July 10?"
      }
    );

    expect(messageId).toBeTruthy();

    const threads = await asManager.query(
      api.functions.inboxThreads.listInboxThreads,
      { status: "new" }
    );
    expect(threads).toHaveLength(1);
    expect(threads[0]).toMatchObject({
      channel: "email",
      guestDisplayName: "Ada Guest",
      unreadCount: 1
    });

    const messages = await asManager.query(
      api.functions.inboxThreads.getThreadMessages,
      { threadId: threads[0]!._id }
    );
    expect(messages[0]).toMatchObject({
      channel: "email",
      direction: "inbound",
      senderName: "Ada Guest",
      messageText: expect.stringContaining("Booking inquiry"),
      emailSubject: "Booking inquiry",
      senderEmail: "guest@example.com"
    });
  });

  it("keeps the same sender's emails to two properties in separate threads", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    // helpers seed slugs: propertyId -> "test-property", otherPropertyId -> "other-property"
    const asManager = authedClient(t, seed.clerkUserId);

    await t.mutation(internal.functions.email.ingestInboundEmailInternal, {
      secret: INTERNAL_SECRET,
      toAddress: formatInboundEmailAddress("test-property"),
      fromAddress: "guest@example.com",
      fromName: "Ada Guest",
      subject: "First property",
      textBody: "Room for July?"
    });

    await t.mutation(internal.functions.email.ingestInboundEmailInternal, {
      secret: INTERNAL_SECRET,
      toAddress: formatInboundEmailAddress("other-property"),
      fromAddress: "guest@example.com",
      fromName: "Ada Guest",
      subject: "Second property",
      textBody: "Room for August?"
    });

    // Manager is scoped to the default property; only sees its own thread.
    const threads = await asManager.query(
      api.functions.inboxThreads.listInboxThreads,
      {}
    );
    expect(threads).toHaveLength(1);
    expect(threads[0]).toMatchObject({
      channel: "email",
      propertyId: seed.propertyId,
      unreadCount: 1
    });

    // Across the whole table both properties have their own thread with
    // distinct, property-scoped keys (no cross-property merge).
    const allThreads = await t.run(async (ctx) =>
      ctx.db.query("inboxThread").collect()
    );
    expect(allThreads).toHaveLength(2);
    const keys = allThreads.map((thread) => thread.threadKey);
    expect(new Set(keys).size).toBe(2);
    expect(keys).toEqual(
      expect.arrayContaining([
        `email:${seed.propertyId}:guest@example.com`,
        `email:${seed.otherPropertyId}:guest@example.com`
      ])
    );
  });

  it("rejects unknown property slug", async () => {
    const t = createTestConvex();
    await seedAuthedManager(t);

    await expect(
      t.mutation(internal.functions.email.ingestInboundEmailInternal, {
        secret: INTERNAL_SECRET,
        toAddress: formatInboundEmailAddress("unknown-property"),
        fromAddress: "guest@example.com",
        fromName: "Guest",
        subject: "Hi",
        textBody: "Hello"
      })
    ).rejects.toThrow(/property/i);
  });
});
