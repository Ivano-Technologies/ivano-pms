import { beforeAll, describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import {
  api,
  createTestConvex,
  seedAuthedManager
} from "../test/helpers";
import { extractMessageKeywords } from "../lib/nlp";

const REFERENCE_DATE = "2026-06-15";

beforeAll(() => {
  process.env.INTERNAL_JOB_SECRET = "test-internal-secret";
});

describe("extractMessageKeywords", () => {
  it("parses July 20-22 date range with suite and guest name", () => {
    const result = extractMessageKeywords(
      "Need suite July 20-22 for Tunde",
      REFERENCE_DATE
    );

    expect(result.extractedCheckIn).toBe("2026-07-20");
    expect(result.extractedCheckOut).toBe("2026-07-22");
    expect(result.extractedUnitType).toBe("suite");
    expect(result.extractedGuestNames).toContain("Tunde");
  });

  it("parses 2 nights from July 15", () => {
    const result = extractMessageKeywords(
      "Hi, I need a suite for 2 nights from July 15",
      REFERENCE_DATE
    );

    expect(result.extractedCheckIn).toBe("2026-07-15");
    expect(result.extractedCheckOut).toBe("2026-07-17");
    expect(result.extractedUnitType).toBe("suite");
  });

  it("parses July 15 for 2 nights", () => {
    const result = extractMessageKeywords(
      "Need accommodation July 15 for 2 nights, budget room",
      REFERENCE_DATE
    );

    expect(result.extractedCheckIn).toBe("2026-07-15");
    expect(result.extractedCheckOut).toBe("2026-07-17");
    expect(result.extractedUnitType).toBe("room");
  });

  it("parses July 10 to July 14 range", () => {
    const result = extractMessageKeywords(
      "Booking inquiry for 4 guests July 10 to July 14",
      REFERENCE_DATE
    );

    expect(result.extractedCheckIn).toBe("2026-07-10");
    expect(result.extractedCheckOut).toBe("2026-07-14");
  });

  it("parses guest name for Ada Okonkwo with room dates", () => {
    const result = extractMessageKeywords(
      "Do you have a room available July 20-22 for Ada Okonkwo?",
      REFERENCE_DATE
    );

    expect(result.extractedGuestNames).toContain("Ada Okonkwo");
    expect(result.extractedUnitType).toBe("room");
    expect(result.extractedCheckIn).toBe("2026-07-20");
  });

  it("parses villa and next weekend", () => {
    const result = extractMessageKeywords(
      "Looking for a villa next weekend for 6 guests",
      REFERENCE_DATE
    );

    expect(result.extractedUnitType).toBe("villa");
    expect(result.extractedCheckIn).toBe("2026-06-20");
    expect(result.extractedCheckOut).toBe("2026-06-22");
  });

  it("parses studio for one week from August 1", () => {
    const result = extractMessageKeywords(
      "Need studio from August 1 for one week please",
      REFERENCE_DATE
    );

    expect(result.extractedUnitType).toBe("studio");
    expect(result.extractedCheckIn).toBe("2026-08-01");
    expect(result.extractedCheckOut).toBe("2026-08-08");
  });

  it("parses villa for Fatima Bello on July 25, 3 nights", () => {
    const result = extractMessageKeywords(
      "Villa for Fatima Bello on July 25, 3 nights",
      REFERENCE_DATE
    );

    expect(result.extractedUnitType).toBe("villa");
    expect(result.extractedGuestNames).toContain("Fatima Bello");
    expect(result.extractedCheckIn).toBe("2026-07-25");
    expect(result.extractedCheckOut).toBe("2026-07-28");
  });

  it("parses room for 2 nights starting July 18", () => {
    const result = extractMessageKeywords(
      "Room for 2 nights starting July 18",
      REFERENCE_DATE
    );

    expect(result.extractedUnitType).toBe("room");
    expect(result.extractedCheckIn).toBe("2026-07-18");
    expect(result.extractedCheckOut).toBe("2026-07-20");
  });

  it("returns empty object for non-actionable text", () => {
    const result = extractMessageKeywords(
      "Hello, what are your rates?",
      REFERENCE_DATE
    );

    expect(result).toEqual({});
  });
});

describe("backfillMessageNlp", () => {
  it("backfills extracted fields on seeded messages", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const now = Date.now();

    const messageId = await t.run(async (ctx) => {
      return await ctx.db.insert("bookingChannelMessage", {
        propertyId: seed.propertyId,
        channel: "whatsapp",
        senderName: "Test Guest",
        messageText: "Need suite July 20-22 for Tunde",
        status: "new",
        createdAt: now,
        updatedAt: now
      });
    });

    await t.mutation(internal.functions.nlp.backfillMessageNlp, {
      secret: "test-internal-secret",
      propertyId: seed.propertyId
    });

    const message = await t.run(async (ctx) => {
      return await ctx.db.get("bookingChannelMessage", messageId);
    });

    expect(message?.extractedCheckIn).toBe("2026-07-20");
    expect(message?.extractedCheckOut).toBe("2026-07-22");
    expect(message?.extractedUnitType).toBe("suite");
    expect(message?.extractedGuestNames).toContain("Tunde");
  });
});

describe("processWebhookEvent NLP", () => {
  it("populates extracted fields on webhook insert", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);

    const messageId = await t.mutation(api.functions.webhooks.processWebhookEvent, {
      secret: "test-internal-secret",
      propertyId: seed.propertyId,
      event: {
        type: "channel.message",
        channel: "whatsapp",
        senderName: "Tunde",
        messageText: "Need suite July 20-22 for Tunde"
      }
    });

    const message = await t.run(async (ctx) => {
      return await ctx.db.get("bookingChannelMessage", messageId);
    });

    expect(message?.extractedCheckIn).toBe("2026-07-20");
    expect(message?.extractedUnitType).toBe("suite");
  });
});
