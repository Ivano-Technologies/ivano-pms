"use client";

import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import { usePropertyScope } from "@/components/layout/property-context";
import { ChannelTokenCard } from "./channel-token-card";
import { EmailInboundCard } from "./email-inbound-card";
import { TelegramConnectionCard } from "./telegram-connection-card";

export function SettingsPageClient() {
  const { propertyArgs } = usePropertyScope();
  const tokens = useQuery(api.functions.channelTokens.getChannelTokens, propertyArgs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Property configuration and channel integrations.
        </p>
      </div>

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
              .filter((token) => token.channel !== "telegram")
              .map((token) => (
                <ChannelTokenCard
                  key={token.channel}
                  channel={token.channel}
                  isConnected={token.isConnected}
                  expiresAt={token.expiresAt}
                  phoneNumberId={token.phoneNumberId}
                  updatedAt={token.updatedAt}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
