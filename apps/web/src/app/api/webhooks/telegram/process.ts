import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

const PROCESS_TELEGRAM_UPDATE =
  "functions/telegramWebhookActions:processTelegramUpdate" as unknown as FunctionReference<
    "action",
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

export async function dispatchTelegramUpdate(update: unknown): Promise<void> {
  const client = getConvexClient();
  await client.action(PROCESS_TELEGRAM_UPDATE, {
    secret: getInternalJobSecret(),
    update
  });
}
