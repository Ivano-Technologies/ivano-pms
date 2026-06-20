import { dispatchWebhookEvent } from "./process";
import { isWebhookEvent, type WebhookEvent } from "./types";
import {
  checkRateLimit,
  verifyWebhookSignature,
  WEBHOOK_SIGNATURE_HEADER
} from "./verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logWebhook(
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
    console.error("[WEBHOOK]", JSON.stringify(entry));
  } else {
    console.info("[WEBHOOK]", JSON.stringify(entry));
  }
}

export async function POST(request: Request): Promise<Response> {
  const timestamp = new Date().toISOString();
  const secret = process.env.WEBHOOK_SECRET?.trim().replace(/^["']|["']$/g, "");

  if (!secret) {
    logWebhook("error", "WEBHOOK_SECRET not configured", { timestamp });
    return new Response("Server misconfigured", { status: 500 });
  }

  const signature = request.headers.get(WEBHOOK_SIGNATURE_HEADER);
  const body = await request.text();

  if (!signature) {
    logWebhook("error", "Missing signature header", {
      timestamp,
      signatureStatus: "missing"
    });
    return new Response("Missing signature", { status: 400 });
  }

  if (!verifyWebhookSignature(signature, body, secret)) {
    logWebhook("error", "Invalid signature", {
      timestamp,
      signatureStatus: "invalid"
    });
    return new Response("Unauthorized", { status: 400 });
  }

  const rateLimit = checkRateLimit(secret.slice(0, 16));
  if (!rateLimit.ok) {
    logWebhook("error", "Rate limit exceeded", { timestamp });
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfter ?? 60)
      }
    });
  }

  let event: WebhookEvent;
  try {
    const parsed: unknown = JSON.parse(body);
    if (!isWebhookEvent(parsed)) {
      logWebhook("error", "Invalid webhook payload schema", {
        timestamp,
        signatureStatus: "valid"
      });
      return new Response("Invalid payload", { status: 400 });
    }
    event = parsed;
  } catch {
    logWebhook("error", "Invalid JSON body", {
      timestamp,
      signatureStatus: "valid"
    });
    return new Response("Invalid JSON", { status: 400 });
  }

  logWebhook("info", "Webhook accepted", {
    timestamp,
    signatureStatus: "valid",
    eventType: event.type,
    channel: event.channel
  });

  void dispatchWebhookEvent(event).catch((error: unknown) => {
    logWebhook("error", "Mutation failed", {
      timestamp,
      signatureStatus: "valid",
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error)
    });
  });

  return new Response("OK", { status: 200 });
}
