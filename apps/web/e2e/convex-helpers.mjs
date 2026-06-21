import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ConvexHttpClient } from "convex/browser";

import { getConvexUrl, getInternalJobSecret } from "./webhook-helpers.mjs";

const LIST_MESSAGES_MUTATION =
  "functions/webhooks:listChannelMessagesForVerification";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const E2E_CONTEXT_PATH = path.join(__dirname, ".e2e-context.json");

export function readE2eContext() {
  return JSON.parse(readFileSync(E2E_CONTEXT_PATH, "utf8"));
}

export function createConvexClient() {
  return new ConvexHttpClient(getConvexUrl());
}

export async function listMessagesForVerification(
  client,
  propertyId,
  options = {}
) {
  return await client.mutation(LIST_MESSAGES_MUTATION, {
      secret: getInternalJobSecret(),
      propertyId,
      messageText: options.messageText,
      limit: options.limit
  });
}

export async function pollMessageByText(
  client,
  propertyId,
  messageText,
  timeoutMs = 5_000
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const messages = await listMessagesForVerification(client, propertyId, {
      messageText,
      limit: 1
    });
    if (messages[0]) {
      return messages[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for message: ${messageText}`);
}
