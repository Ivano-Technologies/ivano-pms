"use client";

import { CHANNEL_META } from "@/lib/inbox-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChannelTokenCardProps = {
  channel: "whatsapp" | "telegram" | "instagram";
  isConnected: boolean;
  expiresAt?: number;
  phoneNumberId?: string;
  updatedAt: number;
};

export function ChannelTokenCard({
  channel,
  isConnected,
  expiresAt,
  phoneNumberId,
  updatedAt
}: ChannelTokenCardProps) {
  const meta = CHANNEL_META[channel];

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
      <div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
              meta.badgeClass
            )}
          >
            {meta.label}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              isConnected ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </div>
        {isConnected ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {phoneNumberId ? `Phone ID: ${phoneNumberId}` : "Token stored"}
            {expiresAt
              ? ` · Expires ${new Date(expiresAt).toLocaleDateString()}`
              : ""}
            {updatedAt > 0
              ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}`
              : ""}
          </p>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            OAuth connection will be available in a future release.
          </p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" disabled>
        Coming soon
      </Button>
    </div>
  );
}
