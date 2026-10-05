"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import { usePropertyScope } from "@/components/layout/property-context";
import { ChannelTokenCard } from "./channel-token-card";
import { EmailInboundCard } from "./email-inbound-card";
import { TelegramConnectionCard } from "./telegram-connection-card";

const OAUTH_ERROR_COPY: Record<string, string> = {
  access_denied: "WhatsApp connect was cancelled.",
  whatsapp_not_configured:
    "WhatsApp OAuth is not configured. Set WHATSAPP_APP_ID and WHATSAPP_APP_SECRET on Vercel.",
  invalid_state: "WhatsApp connect could not be verified. Try again.",
  missing_code: "Meta did not return an authorization code. Try again.",
  token_exchange_failed: "Could not exchange the WhatsApp authorization code.",
  store_failed: "WhatsApp connected at Meta, but the token could not be saved.",
  unauthorized: "Sign in again, then retry WhatsApp Connect."
};

export function SettingsPageClient() {
  const { propertyArgs, selectedPropertyId } = usePropertyScope();
  const tokens = useQuery(api.functions.channelTokens.getChannelTokens, propertyArgs);
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const oauthError = searchParams.get("oauth_error");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Property configuration and channel integrations.
        </p>
      </div>

      {connected === "whatsapp" ? (
        <p
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
        >
          WhatsApp is connected. You can reply to WhatsApp threads from Inbox.
        </p>
      ) : null}

      {oauthError ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {OAUTH_ERROR_COPY[oauthError] ??
            "WhatsApp connect failed. Check Meta app settings and try again."}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Connected channels</h2>
        {tokens === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-20 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <EmailInboundCard />
            <TelegramConnectionCard />
            {tokens
              .filter(
                (token) =>
                  token.channel === "whatsapp" || token.channel === "instagram"
              )
              .map((token) => (
                <ChannelTokenCard
                  key={token.channel}
                  channel={token.channel}
                  isConnected={token.isConnected}
                  expiresAt={token.expiresAt}
                  phoneNumberId={token.phoneNumberId}
                  updatedAt={token.updatedAt}
                  propertyId={selectedPropertyId}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
