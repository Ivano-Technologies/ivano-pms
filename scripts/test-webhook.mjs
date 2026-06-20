/**
 * Local webhook test for POST /api/webhooks
 * Usage: node scripts/test-webhook.mjs
 * Env: WEBHOOK_SECRET (defaults to test_secret_key_12345)
 */
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "test_secret_key_12345";
const BASE_URL = process.env.WEBHOOK_URL ?? "http://localhost:3000";

/** Matches apps/web/src/app/api/webhooks/types.ts */
const payload = {
  type: "channel.message",
  channel: "whatsapp",
  senderName: "Test User",
  messageText: "Test webhook from local script",
  senderPhone: "+2348099999999"
};

const body = JSON.stringify(payload);
const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

console.log("Payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\nHeader: x-webhook-signature");
console.log(signature);

const response = await fetch(`${BASE_URL}/api/webhooks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-signature": signature
  },
  body
});

const text = await response.text();
console.log(`\nResponse: ${response.status} ${text}`);

if (!response.ok) {
  process.exit(1);
}
