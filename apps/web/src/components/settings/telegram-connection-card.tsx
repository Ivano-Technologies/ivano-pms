"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { api } from "../../../../../convex/_generated/api";
import { usePropertyScope } from "@/components/layout/property-context";
import { Button } from "@/components/ui/button";
import { CHANNEL_META } from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";

function qrCodeUrl(deepLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(deepLink)}`;
}

export function TelegramConnectionCard() {
  const { propertyArgs } = usePropertyScope();
  const connection = useQuery(
    api.functions.telegram.getTelegramConnection,
    propertyArgs
  );
  const threads = useQuery(api.functions.telegram.listTelegramThreads, propertyArgs);
  const ensureConnection = useMutation(api.functions.telegram.ensureTelegramConnection);
  const regenerate = useMutation(api.functions.telegram.regenerateTelegramConnectToken);
  const [ensuring, setEnsuring] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const meta = CHANNEL_META.telegram;

  useEffect(() => {
    if (connection !== null || connection === undefined || ensuring) {
      return;
    }

    setEnsuring(true);
    ensureConnection(propertyArgs)
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Could not set up Telegram link";
        toast.error(message);
      })
      .finally(() => setEnsuring(false));
  }, [connection, ensureConnection, ensuring, propertyArgs]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        "Regenerate the guest link? The old link will stop working for new guests."
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      await regenerate(propertyArgs);
      toast.success("New guest link generated");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not regenerate link";
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  };

  const isLoading = connection === undefined || ensuring;
  const linkedCount = threads?.length ?? connection?.linkedChatCount ?? 0;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                meta.badgeClass
              )}
            >
              {meta.label}
            </span>
            <span className="text-xs font-medium text-green-600">Ready to share</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Share the link or QR with guests. When they tap Start in Telegram, messages
            route to this property&apos;s inbox.
          </p>
          {linkedCount > 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {linkedCount} linked guest chat{linkedCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || regenerating || !connection}
          onClick={() => void handleRegenerate()}
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Regenerate
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-muted mt-4 h-24 animate-pulse rounded-lg" />
      ) : connection ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <img
            src={qrCodeUrl(connection.deepLink)}
            alt="Telegram guest link QR code"
            width={180}
            height={180}
            className="rounded-lg border bg-white"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Guest link
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-muted block flex-1 truncate rounded-md px-3 py-2 text-xs">
                {connection.deepLink}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy guest link"
                onClick={() => void handleCopy(connection.deepLink)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Bot @{connection.botUsername} · updated{" "}
              {new Date(connection.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-destructive mt-4 text-sm">
          Telegram is not configured. Set TELEGRAM_BOT_USERNAME in Convex.
        </p>
      )}
    </div>
  );
}
