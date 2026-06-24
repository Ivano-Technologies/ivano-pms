export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

/** Parse `/start` and `/start <property_token>` (deep-link) commands. */
export function parseStartCommand(text: string): { token?: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/start")) {
    return null;
  }

  const rest = trimmed.slice("/start".length).trim();
  if (!rest) {
    return {};
  }

  const parts = rest.split(/\s+/);
  const tokenPart = parts[0]?.startsWith("@") ? parts[1] : parts[0];
  if (!tokenPart) {
    return {};
  }

  return { token: tokenPart };
}

export function telegramDisplayName(user?: TelegramUser): string {
  if (!user) {
    return "Telegram user";
  }

  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }

  return user.username ? `@${user.username}` : "Telegram user";
}

export function telegramChatIdString(chat: TelegramChat): string {
  return String(chat.id);
}

export function telegramUserIdString(user?: TelegramUser): string {
  return user ? String(user.id) : "unknown";
}

export const TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token";

export function buildTelegramApiUrl(
  botToken: string,
  method: string
): string {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

/** Deep link guests tap to open the platform bot with a property token. */
export function buildTelegramDeepLink(
  botUsername: string,
  connectToken: string
): string {
  const username = botUsername.replace(/^@/, "");
  return `https://t.me/${username}?start=${encodeURIComponent(connectToken)}`;
}

export function getTelegramBotUsername(): string {
  const raw = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!raw) {
    throw new Error(
      "TELEGRAM_BOT_USERNAME is not configured (set in Convex dashboard, e.g. IvanoPMSBot)"
    );
  }
  return raw.replace(/^@/, "");
}
