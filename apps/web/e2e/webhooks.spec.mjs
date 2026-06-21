import { test, expect } from "@playwright/test";

import {
  createConvexClient,
  listMessagesForVerification,
  pollMessageByText,
  readE2eContext
} from "./convex-helpers.mjs";
import {
  computeHmacSignature,
  createTestMessage,
  createWebhookClient,
  getWebhookTestBaseUrl,
  getWebhookTestSecret,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TEST_MESSAGES
} from "./webhook-helpers.mjs";

test.describe.configure({ mode: "serial" });

const baseUrl = getWebhookTestBaseUrl();
const webhookSecret = getWebhookTestSecret();
const webhookClient = createWebhookClient(baseUrl, webhookSecret);

test.beforeAll(() => {
  if (
    process.env.WEBHOOK_E2E_SKIP_SEED === "1" &&
    !process.env.DEFAULT_PROPERTY_ID
  ) {
    throw new Error("Set DEFAULT_PROPERTY_ID when WEBHOOK_E2E_SKIP_SEED=1");
  }
});

function getPropertyId() {
  if (process.env.WEBHOOK_E2E_SKIP_SEED === "1") {
    const propertyId = process.env.DEFAULT_PROPERTY_ID?.trim();
    if (!propertyId) {
      throw new Error("DEFAULT_PROPERTY_ID is required when seed is skipped");
    }
    return propertyId;
  }
  return readE2eContext().propertyId;
}

test("POST /api/webhooks with valid HMAC signature", async () => {
  const propertyId = getPropertyId();
  const payload = createTestMessage({
    ...WEBHOOK_TEST_MESSAGES.BOOKING_REQUEST,
    propertyId,
    messageText: `E2E booking suite July 20-22 for Tunde ${Date.now()}`
  });

  const response = await webhookClient.postWebhook(payload);

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("OK");

  const convex = createConvexClient();
  const message = await pollMessageByText(
    convex,
    propertyId,
    payload.messageText
  );

  expect(message.channel).toBe("whatsapp");
  expect(message.senderName).toBe("Tunde Adeyemi");
  expect(message.status).toBe("new");
  expect(message.extractedCheckIn).toBe("2026-07-20");
  expect(message.extractedCheckOut).toBe("2026-07-22");
  expect(message.extractedGuestNames).toContain("Tunde");
  expect(message.extractedUnitType).toBe("suite");
  expect(Date.now() - message.createdAt).toBeLessThan(10_000);
});

test.describe("Error cases", () => {
  test("rejects webhook with missing signature header", async () => {
    const propertyId = getPropertyId();
    const convex = createConvexClient();
    const beforeCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;

    const payload = createTestMessage({
      propertyId,
      messageText: `E2E missing signature ${Date.now()}`
    });

    const response = await fetch(`${baseUrl}/api/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Missing signature");

    const afterCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;
    expect(afterCount).toBe(beforeCount);
  });

  test("rejects webhook with invalid signature", async () => {
    const propertyId = getPropertyId();
    const convex = createConvexClient();
    const beforeCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;

    const payload = createTestMessage({
      propertyId,
      messageText: `E2E invalid signature ${Date.now()}`
    });

    const response = await webhookClient.postWebhook(payload, {
      signature: "invalid_signature_hash"
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Unauthorized");

    const afterCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;
    expect(afterCount).toBe(beforeCount);
  });

  test("rejects webhook with malformed JSON", async () => {
    const propertyId = getPropertyId();
    const convex = createConvexClient();
    const beforeCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;

    const rawBody = "{invalid json";
    const response = await webhookClient.postWebhook(
      createTestMessage({ propertyId }),
      { rawBody }
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid JSON");

    const afterCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;
    expect(afterCount).toBe(beforeCount);
  });

  test("rejects webhook with missing required fields", async () => {
    const propertyId = getPropertyId();
    const convex = createConvexClient();
    const beforeCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;

    const invalidPayload = {
      type: "channel.message",
      channel: "whatsapp",
      senderName: "Test Guest"
    };
    const body = JSON.stringify(invalidPayload);
    const response = await fetch(`${baseUrl}/api/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_SIGNATURE_HEADER]: computeHmacSignature(body, webhookSecret)
      },
      body
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid payload");

    const afterCount = (
      await listMessagesForVerification(convex, propertyId, { limit: 200 })
    ).length;
    expect(afterCount).toBe(beforeCount);
  });
});
