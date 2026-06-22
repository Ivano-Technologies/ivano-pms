"use client";

import { Archive, ArchiveRestore, CheckCircle, Circle, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CHANNEL_META,
  formatRelativeTime,
  isUnread,
  truncateMessage
} from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../../../convex/_generated/dataModel";

type InboxMessageCardProps = {
  message: Doc<"bookingChannelMessage">;
  onMarkReviewed: (id: Doc<"bookingChannelMessage">["_id"]) => void;
  onMarkNew: (id: Doc<"bookingChannelMessage">["_id"]) => void;
  onArchive: (id: Doc<"bookingChannelMessage">["_id"]) => void;
  onUnarchive: (id: Doc<"bookingChannelMessage">["_id"]) => void;
  onConvert: (message: Doc<"bookingChannelMessage">) => void;
};

export function InboxMessageCard({
  message,
  onMarkReviewed,
  onMarkNew,
  onArchive,
  onUnarchive,
  onConvert
}: InboxMessageCardProps) {
  const unread = isUnread(message.status);
  const channelMeta = CHANNEL_META[message.channel as keyof typeof CHANNEL_META];
  const isArchived = message.status === "archived";
  const isConverted = message.status === "converted" || !!message.bookingId;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
        unread
          ? "bg-blue-50/60 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
          : "bg-card border-border hover:bg-muted/40"
      )}
    >
      {/* Unread dot */}
      <div className="mt-1.5 shrink-0">
        {unread ? (
          <span className="block h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm", unread ? "font-semibold" : "font-medium")}>
            {message.senderName}
          </span>
          {channelMeta ? (
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                channelMeta.badgeClass
              )}
            >
              {channelMeta.label}
            </span>
          ) : null}
          {isConverted ? (
            <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Linked booking
            </span>
          ) : null}
        </div>

        <p className="text-muted-foreground mt-0.5 text-sm">
          {truncateMessage(message.messageText)}
        </p>

        {/* Extracted NLP chips */}
        {(message.extractedCheckIn ||
          message.extractedCheckOut ||
          (message.extractedGuestNames && message.extractedGuestNames.length > 0)) ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.extractedCheckIn ? (
              <span className="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
                In: {message.extractedCheckIn}
              </span>
            ) : null}
            {message.extractedCheckOut ? (
              <span className="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs">
                Out: {message.extractedCheckOut}
              </span>
            ) : null}
            {message.extractedGuestNames?.slice(0, 2).map((name) => (
              <span
                key={name}
                className="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-muted-foreground mt-1.5 text-xs">
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Mark reviewed / new toggle */}
        {!isArchived ? (
          unread ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mark as reviewed"
              onClick={() => onMarkReviewed(message._id)}
            >
              <CheckCircle className="size-4" />
            </Button>
          ) : message.status === "reviewed" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mark as new"
              onClick={() => onMarkNew(message._id)}
            >
              <Circle className="size-4" />
            </Button>
          ) : null
        ) : null}

        {/* Archive / unarchive */}
        {isArchived ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Restore from archive"
            onClick={() => onUnarchive(message._id)}
          >
            <ArchiveRestore className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Archive"
            onClick={() => onArchive(message._id)}
          >
            <Archive className="size-4" />
          </Button>
        )}

        {/* Convert to booking */}
        {!isConverted && !isArchived ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Convert to booking"
            onClick={() => onConvert(message)}
          >
            <PlusCircle className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
