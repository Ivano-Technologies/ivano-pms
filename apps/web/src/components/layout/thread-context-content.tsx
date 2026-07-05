"use client";

import type { Doc } from "../../../../../convex/_generated/dataModel";
import { StatusChip } from "@/components/ui/status-chip";
import { CHANNEL_META } from "@/lib/inbox-utils";

type ThreadBookingSummary = {
  checkInDate: string;
  checkOutDate?: string;
  status: string;
};

type ThreadContextContentProps = {
  thread: Doc<"inboxThread">;
  bookingSummary?: ThreadBookingSummary | null;
};

export function ThreadContextContent({
  thread,
  bookingSummary
}: ThreadContextContentProps) {
  const channelMeta = CHANNEL_META[thread.channel];

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Guest
        </p>
        <p className="font-semibold">{thread.guestDisplayName}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {channelMeta ? (
          <StatusChip tone="brand">{channelMeta.label}</StatusChip>
        ) : null}
        <StatusChip tone={thread.unreadCount > 0 ? "warning" : "success"}>
          {thread.status === "new" && thread.unreadCount > 0
            ? "Awaiting reply"
            : thread.status.replaceAll("_", " ")}
        </StatusChip>
      </div>

      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Latest message
        </p>
        <p className="mt-1">{thread.lastMessagePreview}</p>
      </div>

      {thread.bookingId && bookingSummary ? (
        <div className="rounded-[var(--radius)] border p-3">
          <p className="font-medium">Linked booking</p>
          <p className="text-muted-foreground mt-1">
            {bookingSummary.checkInDate}
            {bookingSummary.checkOutDate
              ? ` → ${bookingSummary.checkOutDate}`
              : ""}
          </p>
          <p className="text-muted-foreground capitalize">
            {bookingSummary.status.replaceAll("_", " ")}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">No linked booking on this thread yet.</p>
      )}
    </div>
  );
}
