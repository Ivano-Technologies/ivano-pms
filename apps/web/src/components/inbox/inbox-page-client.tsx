"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { usePropertyScope } from "@/components/layout/property-context";
import { type MessageStatus, STATUS_FILTER_OPTIONS } from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";
import { InboxMessageCard } from "./inbox-message-card";

const ConvertToBookingModal = dynamic(
  () =>
    import("./convert-to-booking-modal").then((m) => ({
      default: m.ConvertToBookingModal
    })),
  { ssr: false }
);

type StatusFilter = MessageStatus | "all";

export function InboxPageClient() {
  const { propertyArgs } = usePropertyScope();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");
  const [convertingMessage, setConvertingMessage] =
    useState<Doc<"bookingChannelMessage"> | null>(null);

  const queryStatus =
    statusFilter === "all" ? undefined : (statusFilter as MessageStatus);

  const messages = useQuery(api.functions.channelMessages.getChannelMessages, {
    status: queryStatus,
    limit: 50,
    ...propertyArgs
  });

  const unreadMessages = useQuery(
    api.functions.channelMessages.getChannelMessages,
    { status: "new", limit: 100, ...propertyArgs }
  );

  const markReviewed = useMutation(
    api.functions.channelMessages.markMessageReviewed
  );
  const markNew = useMutation(api.functions.channelMessages.markMessageNew);
  const archive = useMutation(api.functions.channelMessages.archiveMessage);
  const unarchive = useMutation(api.functions.channelMessages.unarchiveMessage);

  const unreadCount = unreadMessages?.length ?? 0;
  const isLoading = messages === undefined;

  async function handleMarkReviewed(id: Doc<"bookingChannelMessage">["_id"]) {
    try {
      await markReviewed({ messageId: id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleMarkNew(id: Doc<"bookingChannelMessage">["_id"]) {
    try {
      await markNew({ messageId: id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleArchive(id: Doc<"bookingChannelMessage">["_id"]) {
    try {
      await archive({ messageId: id });
      toast.success("Archived");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleUnarchive(id: Doc<"bookingChannelMessage">["_id"]) {
    try {
      await unarchive({ messageId: id });
      toast.success("Restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleMarkAllReviewed() {
    if (!unreadMessages || unreadMessages.length === 0) return;
    try {
      await Promise.all(
        unreadMessages.map((m) => markReviewed({ messageId: m._id }))
      );
      toast.success(`Marked ${unreadMessages.length} messages as reviewed`);
    } catch {
      toast.error("Some messages could not be updated");
    }
  }

  const emptyStateText: Record<StatusFilter, string> = {
    new: "No new messages. You're all caught up!",
    reviewed: "No reviewed messages yet.",
    archived: "No archived messages.",
    converted: "No converted messages.",
    all: "No messages yet."
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Inbox</h1>
          {unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
        {statusFilter === "new" && unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleMarkAllReviewed}
          >
            <CheckCheck className="size-4" />
            Mark all reviewed
          </Button>
        ) : null}
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter messages"
        className="flex flex-wrap gap-1.5"
      >
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={statusFilter === opt.value}
            onClick={() => setStatusFilter(opt.value as StatusFilter)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {opt.label}
            {opt.value === "new" && unreadCount > 0
              ? ` (${unreadCount})`
              : ""}
          </button>
        ))}
      </div>

      {/* Message list */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading messages">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-20 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-1 py-16 text-center">
          <p className="font-medium">{emptyStateText[statusFilter]}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => (
            <InboxMessageCard
              key={message._id}
              message={message}
              onMarkReviewed={handleMarkReviewed}
              onMarkNew={handleMarkNew}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onConvert={setConvertingMessage}
            />
          ))}
        </div>
      )}

      <ConvertToBookingModal
        message={convertingMessage}
        isOpen={!!convertingMessage}
        onClose={() => setConvertingMessage(null)}
      />
    </div>
  );
}
