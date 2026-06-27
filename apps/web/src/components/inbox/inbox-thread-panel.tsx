"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  CHANNEL_META,
  formatRelativeTime
} from "@/lib/inbox-utils";
import { cn } from "@/lib/utils";

type InboxThreadPanelProps = {
  thread: Doc<"inboxThread"> | null;
  onMarkReviewed: (threadId: Doc<"inboxThread">["_id"]) => void;
  onConvert: (message: Doc<"bookingChannelMessage">) => void;
};

export function InboxThreadPanel({
  thread,
  onMarkReviewed,
  onConvert
}: InboxThreadPanelProps) {
  const [replyText, setReplyText] = useState("");

  const messages = useQuery(
    api.functions.inboxThreads.getThreadMessages,
    thread ? { threadId: thread._id } : "skip"
  );

  const reply = useMutation(api.functions.telegram.replyToTelegramThread);
  const isLoading = thread !== null && messages === undefined;
  const canReply = thread?.channel === "telegram" && !!thread.telegramChatId;

  async function handleSendReply() {
    if (!thread || !replyText.trim()) return;
    try {
      await reply({ threadId: thread._id, messageText: replyText.trim() });
      setReplyText("");
      toast.success("Reply sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    }
  }

  if (!thread) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-center text-sm">
        Select a thread to view the conversation
      </div>
    );
  }

  const channelMeta = CHANNEL_META[thread.channel];
  const chronological = [...(messages ?? [])].reverse();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">{thread.guestDisplayName}</h2>
          <div className="mt-1 flex items-center gap-2">
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
            {thread.unreadCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMarkReviewed(thread._id)}
              >
                Mark reviewed
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-label="Conversation">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-14 max-w-[80%] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : chronological.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages in this thread yet.</p>
        ) : (
          chronological.map((message) => {
            const outbound = message.direction === "outbound";
            const latestInbound = !outbound && message.status === "new";

            return (
              <div
                key={message._id}
                className={cn("flex", outbound ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    outbound
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border-border border"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.messageText}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-2 text-[10px]",
                      outbound ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    <span>{formatRelativeTime(message.createdAt)}</span>
                    {latestInbound ? (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => onConvert(message)}
                      >
                        Create booking
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canReply ? (
        <footer className="border-border border-t p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendReply();
            }}
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleSendReply();
                }
              }}
              rows={2}
              placeholder="Reply to guest… (Ctrl+Enter to send)"
              className="border-input bg-background focus-visible:ring-ring min-h-11 flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              aria-label="Reply message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!replyText.trim()}
              aria-label="Send reply"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </footer>
      ) : (
        <footer className="border-border text-muted-foreground border-t p-3 text-xs">
          Replies from the inbox are available for Telegram threads only.
        </footer>
      )}
    </div>
  );
}
