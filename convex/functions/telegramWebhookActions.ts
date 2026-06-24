"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction, action } from "../_generated/server";
import {
  buildTelegramApiUrl,
  parseStartCommand,
  type TelegramUpdate,
  telegramChatIdString,
  telegramDisplayName,
  telegramUserIdString
} from "../lib/telegram";
import { assertInternalJobSecret } from "../lib/secrets";

function requireTelegramEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

async function callTelegramApi<T>(
  botToken: string,
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(buildTelegramApiUrl(botToken, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: T;
  };

  if (!payload.ok) {
    throw new Error(payload.description ?? `Telegram ${method} failed`);
  }

  return payload.result as T;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  await callTelegramApi(botToken, "sendMessage", {
    chat_id: chatId,
    text
  });
}

const registerResult = v.object({
  ok: v.boolean(),
  description: v.string()
});

/** Register the bot webhook with Telegram (run once per deployment URL). */
export const registerTelegramWebhook = internalAction({
  args: {
    secret: v.string()
  },
  returns: registerResult,
  handler: async (_ctx, args) => {
    assertInternalJobSecret(args.secret);

    const botToken = requireTelegramEnv("TELEGRAM_BOT_TOKEN");
    const webhookUrl = requireTelegramEnv("TELEGRAM_WEBHOOK_URL");
    const secretToken = requireTelegramEnv("TELEGRAM_WEBHOOK_SECRET");

    const result = await callTelegramApi<boolean>(
      botToken,
      "setWebhook",
      {
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ["message"]
      }
    );

    return {
      ok: Boolean(result),
      description: "Webhook was set"
    };
  }
});

/** Process a Telegram update forwarded from the Next.js webhook route. */
export const processTelegramUpdate = action({
  args: {
    secret: v.string(),
    update: v.any()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    assertInternalJobSecret(args.secret);

    const botToken = requireTelegramEnv("TELEGRAM_BOT_TOKEN");
    const update = args.update as TelegramUpdate;
    const message = update.message;
    if (!message?.text) {
      return null;
    }

    const chatId = telegramChatIdString(message.chat);
    const userId = telegramUserIdString(message.from);
    const senderName = telegramDisplayName(message.from);
    const start = parseStartCommand(message.text);

    if (start) {
      if (!start.token) {
        await sendTelegramMessage(
          botToken,
          chatId,
          "Send /start with the property link token from Ivano PMS Settings to connect this chat."
        );
        return null;
      }

      try {
        const linked = await ctx.runMutation(
          internal.functions.telegram.linkChatFromStartInternal,
          {
            secret: args.secret,
            connectToken: start.token,
            telegramChatId: chatId,
            telegramUserId: userId,
            senderName
          }
        );

        await sendTelegramMessage(
          botToken,
          chatId,
          `Connected to ${linked.propertyName}. Send booking inquiries here and your property manager will see them in Ivano PMS.`
        );
      } catch {
        await sendTelegramMessage(
          botToken,
          chatId,
          "That property link is invalid or expired. Ask your manager for a new Telegram connect link."
        );
      }

      return null;
    }

    try {
      await ctx.runMutation(internal.functions.telegram.ingestTelegramMessageInternal, {
        secret: args.secret,
        telegramChatId: chatId,
        senderName,
        messageText: message.text,
        telegramUserId: userId
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Unable to process message";
      if (messageText.includes("not linked")) {
        await sendTelegramMessage(
          botToken,
          chatId,
          "This chat is not linked yet. Use /start with your property link token from Ivano PMS Settings."
        );
      }
    }

    return null;
  }
});
