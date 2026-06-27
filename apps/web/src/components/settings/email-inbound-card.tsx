"use client";

import { Copy } from "lucide-react";
import { useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../../../../convex/_generated/api";
import { usePropertyScope } from "@/components/layout/property-context";
import { Button } from "@/components/ui/button";
import { CHANNEL_META } from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";

export function EmailInboundCard() {
  const { propertyArgs } = usePropertyScope();
  const connection = useQuery(
    api.functions.email.getEmailInboundConnection,
    propertyArgs
  );

  const meta = CHANNEL_META.email;

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy address");
    }
  };

  return (
    <div className="rounded-xl border p-4">
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
          <span className="text-xs font-medium text-green-600">Ready to receive</span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Forward booking inquiries to this address. Each property has a unique
          plus-address on <code className="text-xs">pms.techivano.com</code>.
        </p>
      </div>

      {connection === undefined ? (
        <div className="bg-muted mt-4 h-12 animate-pulse rounded-lg" />
      ) : connection ? (
        <div className="mt-4 space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Inbound address
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-muted block flex-1 truncate rounded-md px-3 py-2 text-xs">
              {connection.inboundAddress}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy inbound email address"
              onClick={() => void handleCopy(connection.inboundAddress)}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Property slug: <span className="font-mono">{connection.slug}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
