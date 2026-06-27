"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { usePropertyScope } from "@/components/layout/property-context";
import { type MessageStatus, STATUS_FILTER_OPTIONS } from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";
import { InboxThreadList } from "./inbox-thread-list";
import { InboxThreadPanel } from "./inbox-thread-panel";

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
  const [selectedThreadId, setSelectedThreadId] =
    useState<Doc<"inboxThread">["_id"] | null>(null);
  const [convertingMessage, setConvertingMessage] =
    useState<Doc<"bookingChannelMessage"> | null>(null);

  const queryStatus =
    statusFilter === "all" ? undefined : (statusFilter as MessageStatus);

  const threads = useQuery(api.functions.inboxThreads.listInboxThreads, {
    status: queryStatus,
    limit: 50,
    ...propertyArgs
  });

  const unreadThreads = useQuery(api.functions.inboxThreads.listInboxThreads, {
    status: "new",
    limit: 100,
    ...propertyArgs
  });

  const markThreadReviewed = useMutation(api.functions.inboxThreads.markThreadReviewed);

  const unreadCount =
    unreadThreads?.reduce((sum, thread) => sum + thread.unreadCount, 0) ?? 0;
  const isLoading = threads === undefined;

  const selectedThread =
    threads?.find((thread) => thread._id === selectedThreadId) ??
    (threads && threads.length > 0 && !selectedThreadId ? threads[0] : null);

  const activeThreadId = selectedThread?._id ?? null;

  async function handleMarkThreadReviewed(threadId: Doc<"inboxThread">["_id"]) {
    try {
      await markThreadReviewed({ threadId });
      toast.success("Thread marked reviewed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const emptyStateText: Record<StatusFilter, string> = {
    new: "No new threads. You're all caught up!",
    reviewed: "No reviewed threads yet.",
    archived: "No archived threads.",
    converted: "No converted threads.",
    all: "No threads yet."
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-border space-y-3 border-b p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Inbox</h1>
          {unreadCount > 0 ? (
            <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
              {unreadCount}
            </span>
          ) : null}
        </div>

        <div
          role="tablist"
          aria-label="Filter threads"
          className="flex flex-wrap gap-1.5"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              type="button"
              aria-selected={statusFilter === opt.value}
              onClick={() => {
                setStatusFilter(opt.value as StatusFilter);
                setSelectedThreadId(null);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && threads.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
          <p className="font-medium">{emptyStateText[statusFilter]}</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(260px,320px)_1fr]">
          <div className="border-border min-h-0 overflow-hidden border-r">
            <InboxThreadList
              threads={threads}
              selectedThreadId={activeThreadId}
              onSelect={setSelectedThreadId}
              isLoading={isLoading}
            />
          </div>
          <InboxThreadPanel
            thread={selectedThread}
            onMarkReviewed={handleMarkThreadReviewed}
            onConvert={setConvertingMessage}
          />
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
