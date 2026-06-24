export const TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token";

/** Constant-time compare is unnecessary for high-entropy webhook secrets; equality is enough. */
export function verifyTelegramWebhookSecret(
  headerValue: string | null,
  expectedSecret: string
): boolean {
  if (!headerValue || !expectedSecret) {
    return false;
  }

  return headerValue === expectedSecret;
}
