import { beforeAll, describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import {
  api,
  authedClient,
  createTestConvex,
  seedAuthedManager
} from "./helpers";

beforeAll(() => {
  process.env.INTERNAL_JOB_SECRET = "test-internal-secret";
});

describe("getChannelTokens", () => {
  it("returns disconnected status for all channels by default", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);

    const tokens = await asManager.query(
      api.functions.channelTokens.getChannelTokens,
      {}
    );

    expect(tokens).toHaveLength(3);
    expect(tokens.every((t) => !t.isConnected)).toBe(true);
  });
});

describe("upsertChannelTokenInternal", () => {
  it("stores and surfaces a connected channel token", async () => {
    const t = createTestConvex();
    const seed = await seedAuthedManager(t);
    const asManager = authedClient(t, seed.clerkUserId);
    const now = Date.now();

    await t.mutation(internal.functions.channelTokens.upsertChannelTokenInternal, {
      secret: process.env.INTERNAL_JOB_SECRET ?? "test-internal-secret",
      propertyId: seed.propertyId,
      channel: "whatsapp",
      accessToken: "test-token",
      phoneNumberId: "12345",
      expiresAt: now + 86_400_000
    });

    const tokens = await asManager.query(
      api.functions.channelTokens.getChannelTokens,
      {}
    );

    const whatsapp = tokens.find((row) => row.channel === "whatsapp");
    expect(whatsapp?.isConnected).toBe(true);
    expect(whatsapp?.phoneNumberId).toBe("12345");
  });
});
