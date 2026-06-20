import crypto from "crypto";

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";
export const RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

/** Reset store — for tests only. */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string,
  algorithm: "sha256" = "sha256"
): boolean {
  const expected = crypto
    .createHmac(algorithm, secret)
    .update(body)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function checkRateLimit(key: string): {
  ok: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000
    );
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  bucket.count += 1;
  rateLimitStore.set(key, bucket);
  return { ok: true };
}

export function signWebhookBody(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}
