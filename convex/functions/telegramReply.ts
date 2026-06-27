"use node";

import { v } from "convex/values";

import { internalAction } from "../_generated/server";
import { buildTelegramApiUrl } from "../lib/telegram";
import { assertInternalJobSecret } from "../lib/secrets";

function requireTelegramEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export const sendTelegramReplyInternal = internalAction({
  args: {
    secret: v.string(),
    telegramChatId: v.string(),
    messageText: v.string()
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    assertInternalJobSecret(args.secret);

    const botToken = requireTelegramEnv("TELEGRAM_BOT_TOKEN");
    const response = await fetch(buildTelegramApiUrl(botToken, "sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: args.telegramChatId,
        text: args.messageText
      })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      description?: string;
    };

    if (!payload.ok) {
      throw new Error(payload.description ?? "Telegram sendMessage failed");
    }

    return null;
  }
});
