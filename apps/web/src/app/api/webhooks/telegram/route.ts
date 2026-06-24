import { dispatchTelegramUpdate } from "./process";
import {
  TELEGRAM_SECRET_HEADER,
  verifyTelegramWebhookSecret
} from "./verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logTelegram(
  level: "error" | "info",
  message: string,
  meta?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  if (level === "error") {
    console.error("[TELEGRAM_WEBHOOK]", JSON.stringify(entry));
  } else {
    console.info("[TELEGRAM_WEBHOOK]", JSON.stringify(entry));
  }
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim().replace(
    /^["']|["']$/g,
    ""
  );

  if (!secret) {
    logTelegram("error", "TELEGRAM_WEBHOOK_SECRET not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  const headerSecret = request.headers.get(TELEGRAM_SECRET_HEADER);
  if (!verifyTelegramWebhookSecret(headerSecret, secret)) {
    logTelegram("error", "Invalid Telegram webhook secret_token header", {
      headerStatus: headerSecret ? "mismatch" : "missing"
    });
    return new Response("Unauthorized", { status: 401 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    logTelegram("error", "Invalid JSON body");
    return new Response("Invalid JSON", { status: 400 });
  }

  logTelegram("info", "Telegram update accepted");

  void dispatchTelegramUpdate(update).catch((error: unknown) => {
    logTelegram("error", "Telegram update processing failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  return new Response("OK", { status: 200 });
}
