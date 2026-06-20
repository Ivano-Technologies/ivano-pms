export type WebhookChannel = "whatsapp" | "telegram" | "instagram";

/** Supported webhook event types — extend in Phase 2. */
export type WebhookEventType = "channel.message";

export interface ChannelMessageWebhookEvent {
  type: "channel.message";
  channel: WebhookChannel;
  senderName: string;
  messageText: string;
  senderPhone?: string;
  telegramUserId?: string;
  instagramUserId?: string;
  /** Optional override; defaults to DEFAULT_PROPERTY_ID env. */
  propertyId?: string;
}

export type WebhookEvent = ChannelMessageWebhookEvent;

export function isWebhookEvent(value: unknown): value is WebhookEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Record<string, unknown>;
  if (event.type !== "channel.message") {
    return false;
  }
  if (
    event.channel !== "whatsapp" &&
    event.channel !== "telegram" &&
    event.channel !== "instagram"
  ) {
    return false;
  }
  return (
    typeof event.senderName === "string" &&
    typeof event.messageText === "string"
  );
}
