import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

const PROCESS_INBOUND_EMAIL =
  "functions/emailWebhookActions:processInboundEmail" as unknown as FunctionReference<
    "action",
    "public"
  >;

export type InboundEmailPayload = {
  toAddress: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  textBody: string;
};

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

export async function dispatchInboundEmail(
  payload: InboundEmailPayload
): Promise<void> {
  const client = getConvexClient();
  await client.action(PROCESS_INBOUND_EMAIL, {
    secret: getInternalJobSecret(),
    ...payload
  });
}
