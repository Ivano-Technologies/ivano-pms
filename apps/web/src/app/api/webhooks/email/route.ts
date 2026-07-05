import { dispatchInboundEmail } from "./process";
import { EMAIL_WEBHOOK_SECRET_HEADER, verifyEmailWebhookSecret } from "./verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function logEmail(
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
    console.error("[EMAIL_WEBHOOK]", JSON.stringify(entry));
  } else {
    console.info("[EMAIL_WEBHOOK]", JSON.stringify(entry));
  }
}

type EmailWebhookBody = {
  toAddress?: string;
  fromAddress?: string;
  fromName?: string;
  subject?: string;
  textBody?: string;
};

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.EMAIL_WEBHOOK_SECRET?.trim().replace(
    /^["']|["']$/g,
    ""
  );

  if (!secret) {
    logEmail("error", "EMAIL_WEBHOOK_SECRET not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  const headerSecret = request.headers.get(EMAIL_WEBHOOK_SECRET_HEADER);
  if (!verifyEmailWebhookSecret(headerSecret, secret)) {
    logEmail("error", "Invalid email webhook secret header", {
      headerStatus: headerSecret ? "mismatch" : "missing"
    });
    return new Response("Unauthorized", { status: 401 });
  }

  let body: EmailWebhookBody;
  try {
    body = (await request.json()) as EmailWebhookBody;
  } catch {
    logEmail("error", "Invalid JSON body");
    return new Response("Invalid JSON", { status: 400 });
  }

  const toAddress = body.toAddress?.trim();
  const fromAddress = body.fromAddress?.trim();
  const subject = body.subject?.trim() ?? "";
  const textBody = body.textBody?.trim() ?? "";

  if (!toAddress || !fromAddress) {
    logEmail("error", "Missing required email fields", {
      hasTo: Boolean(toAddress),
      hasFrom: Boolean(fromAddress)
    });
    return new Response("Missing toAddress or fromAddress", { status: 400 });
  }

  logEmail("info", "Inbound email accepted", { toAddress, fromAddress });

  void dispatchInboundEmail({
    toAddress,
    fromAddress,
    fromName: body.fromName?.trim() || undefined,
    subject,
    textBody
  }).catch((error: unknown) => {
    logEmail("error", "Inbound email processing failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  return new Response("OK", { status: 200 });
}
