import crypto from "node:crypto";

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";

export function computeHmacSignature(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function createTestMessage(overrides = {}) {
  return {
    type: "channel.message",
    channel: "whatsapp",
    senderName: "Tunde Adeyemi",
    messageText: "Hi! I'd like to book a suite for July 20-22 for Tunde",
    senderPhone: "+2348012345678",
    ...overrides
  };
}

export const WEBHOOK_TEST_MESSAGES = {
  BOOKING_REQUEST: createTestMessage({
    senderName: "Tunde Adeyemi",
    messageText: "Hi! I'd like to book a suite for July 20-22 for Tunde"
  }),
  EARLY_CHECKIN: createTestMessage({
    senderName: "Ada Okonkwo",
    messageText: "Can we check in early tomorrow? for Ada Okonkwo"
  }),
  UNIT_PREFERENCE: createTestMessage({
    channel: "instagram",
    senderName: "Guest",
    instagramUserId: "user_abc123",
    messageText: "Looking for a villa with ocean view starting July 15 for 3 nights"
  })
};

export class WebhookClient {
  constructor(baseUrl, secret) {
    this.baseUrl = baseUrl;
    this.secret = secret;
  }

  async postWebhook(payload, options = {}) {
    const body = options.rawBody ?? JSON.stringify(payload);
    const signature =
      options.signature ?? computeHmacSignature(body, this.secret);

    return fetch(`${this.baseUrl}/api/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_SIGNATURE_HEADER]: signature
      },
      body
    });
  }
}

export function createWebhookClient(baseUrl, secret) {
  return new WebhookClient(baseUrl, secret);
}

export function getWebhookTestSecret() {
  return cleanEnv(process.env.WEBHOOK_SECRET) ?? "test-webhook-secret-12345";
}

export function getWebhookTestBaseUrl() {
  return cleanEnv(process.env.WEBHOOK_TEST_URL) ?? "http://localhost:3000";
}

export function getInternalJobSecret() {
  const secret = cleanEnv(process.env.INTERNAL_JOB_SECRET);
  if (!secret) {
    throw new Error("INTERNAL_JOB_SECRET is required for webhook E2E tests");
  }
  return secret;
}

function cleanEnv(value) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

export function getConvexUrl() {
  const url =
    cleanEnv(process.env.NEXT_PUBLIC_CONVEX_URL) ??
    cleanEnv(process.env.CONVEX_URL);
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required for webhook E2E tests");
  }
  return url;
}
