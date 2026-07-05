export const EMAIL_WEBHOOK_SECRET_HEADER = "x-email-webhook-secret";

export function verifyEmailWebhookSecret(
  headerValue: string | null,
  expectedSecret: string
): boolean {
  if (!headerValue || !expectedSecret) {
    return false;
  }

  return headerValue === expectedSecret;
}
