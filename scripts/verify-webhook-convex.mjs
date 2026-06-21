/**
 * Webhook smoke test: POST /api/webhooks → poll Convex for inserted message.
 *
 * Usage:
 *   node scripts/verify-webhook-convex.mjs
 *
 * Env:
 *   WEBHOOK_SECRET, INTERNAL_JOB_SECRET, DEFAULT_PROPERTY_ID,
 *   NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL), WEBHOOK_URL (default http://localhost:3000)
 */
import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api.js";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "test-webhook-secret-12345";
const BASE_URL = process.env.WEBHOOK_URL ?? "http://localhost:3000";
const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
const INTERNAL_JOB_SECRET = process.env.INTERNAL_JOB_SECRET;
const PROPERTY_ID = process.env.DEFAULT_PROPERTY_ID;

const POLL_TIMEOUT_MS = 2_000;
const POLL_INTERVAL_MS = 200;

const payload = {
  type: "channel.message",
  channel: "whatsapp",
  senderName: "Tunde Adeyemi",
  messageText: `Smoke test suite July 20-22 for Tunde ${Date.now()}`,
  senderPhone: "+2348012345678",
  ...(PROPERTY_ID ? { propertyId: PROPERTY_ID } : {})
};

function signBody(body) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

async function pollConvexMessage(client, propertyId, messageText) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const messages = await client.mutation(
      api.functions.webhooks.listChannelMessagesForVerification,
      {
        secret: INTERNAL_JOB_SECRET,
        propertyId,
        messageText,
        limit: 1
      }
    );

    if (messages?.[0]) {
      return messages[0];
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return null;
}

function assertExtraction(message) {
  const errors = [];

  if (message.status !== "new") {
    errors.push(`expected status "new", got "${message.status}"`);
  }
  if (message.extractedCheckIn !== "2026-07-20") {
    errors.push(
      `expected extractedCheckIn 2026-07-20, got ${message.extractedCheckIn}`
    );
  }
  if (message.extractedCheckOut !== "2026-07-22") {
    errors.push(
      `expected extractedCheckOut 2026-07-22, got ${message.extractedCheckOut}`
    );
  }
  if (!message.extractedGuestNames?.includes("Tunde")) {
    errors.push("expected extractedGuestNames to include Tunde");
  }
  if (message.extractedUnitType !== "suite") {
    errors.push(
      `expected extractedUnitType suite, got ${message.extractedUnitType}`
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

async function main() {
  if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL or CONVEX_URL is required");
  }
  if (!INTERNAL_JOB_SECRET) {
    throw new Error("INTERNAL_JOB_SECRET is required");
  }
  if (!PROPERTY_ID) {
    throw new Error("DEFAULT_PROPERTY_ID is required");
  }

  const body = JSON.stringify(payload);
  const signature = signBody(body);

  const response = await fetch(`${BASE_URL}/api/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature
    },
    body
  });

  const responseText = await response.text();
  console.log(`Webhook response: ${response.status} ${responseText}`);

  if (!response.ok) {
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const message = await pollConvexMessage(
    client,
    PROPERTY_ID,
    payload.messageText
  );

  if (!message) {
    console.error(
      `No bookingChannelMessage found within ${POLL_TIMEOUT_MS}ms for messageText`
    );
    process.exit(1);
  }

  assertExtraction(message);
  console.log("Convex verification passed:", {
    id: message._id,
    status: message.status,
    extractedCheckIn: message.extractedCheckIn,
    extractedCheckOut: message.extractedCheckOut,
    extractedGuestNames: message.extractedGuestNames,
    extractedUnitType: message.extractedUnitType
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
