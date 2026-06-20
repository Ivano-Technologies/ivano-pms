import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

import type { Id } from "../../../../../../convex/_generated/dataModel";
import type { WebhookEvent } from "./types";

const PROCESS_WEBHOOK = "functions/webhooks:processWebhookEvent" as unknown as FunctionReference<
  "mutation",
  "public"
>;

function cleanEnv(value: string | undefined): string | undefined {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function getConvexClient(): ConvexHttpClient {
  const url =
    cleanEnv(process.env.NEXT_PUBLIC_CONVEX_URL) ??
    cleanEnv(process.env.CONVEX_URL);
  if (!url) {
    throw new Error("CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

function getInternalJobSecret(): string {
  const secret = cleanEnv(process.env.INTERNAL_JOB_SECRET);
  if (!secret) {
    throw new Error("INTERNAL_JOB_SECRET is not configured");
  }
  return secret;
}

function getDefaultPropertyId(): Id<"property"> {
  const id = cleanEnv(process.env.DEFAULT_PROPERTY_ID);
  if (!id) {
    throw new Error("DEFAULT_PROPERTY_ID is not configured");
  }
  return id as Id<"property">;
}

/** Fire-and-forget Convex mutation for a verified webhook event. */
export async function dispatchWebhookEvent(event: WebhookEvent): Promise<void> {
  const client = getConvexClient();
  const propertyId = (event.propertyId ?? getDefaultPropertyId()) as Id<"property">;

  await client.mutation(PROCESS_WEBHOOK, {
    secret: getInternalJobSecret(),
    propertyId,
    event: {
      type: event.type,
      channel: event.channel,
      senderName: event.senderName,
      messageText: event.messageText,
      senderPhone: event.senderPhone,
      telegramUserId: event.telegramUserId,
      instagramUserId: event.instagramUserId
    }
  });
}
