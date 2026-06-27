"use client";

import type { Doc } from "../../../../../convex/_generated/dataModel";
import {
  CHANNEL_META,
  formatRelativeTime,
  truncateMessage
} from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";

type InboxThreadListProps = {
  threads: Doc<"inboxThread">[] | undefined;
  selectedThreadId: Doc<"inboxThread">["_id"] | null;
  onSelect: (threadId: Doc<"inboxThread">["_id"]) => void;
  isLoading: boolean;
};

export function InboxThreadList({
  threads,
  selectedThreadId,
  onSelect,
  isLoading
}: InboxThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3" aria-busy="true" aria-label="Loading threads">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="text-muted-foreground p-6 text-center text-sm">
        No guest threads yet. Connect Telegram in Settings and share your property link.
      </div>
    );
  }

  return (
    <ul className="divide-border divide-y overflow-y-auto" aria-label="Guest threads">
      {threads.map((thread) => {
        const channelMeta = CHANNEL_META[thread.channel];
        const selected = selectedThreadId === thread._id;
        const unread = thread.unreadCount > 0;

        return (
          <li key={thread._id}>
            <button
              type="button"
              onClick={() => onSelect(thread._id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "hover:bg-muted/50 flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
                selected && "bg-muted/70 border-l-primary border-l-2",
                unread && !selected && "bg-blue-50/40 dark:bg-blue-950/10"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                  {thread.guestDisplayName}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatRelativeTime(thread.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {channelMeta ? (
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      channelMeta.badgeClass
                    )}
                  >
                    {channelMeta.label}
                  </span>
                ) : null}
                {unread ? (
                  <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {truncateMessage(thread.lastMessagePreview, 80)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
