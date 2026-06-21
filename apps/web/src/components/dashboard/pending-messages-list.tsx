import { Camera, MessageCircle, Send } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMessageExtractionBadge, formatMessageTimestamp, truncateText } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PendingMessageView = {
  id: string;
  channel: "whatsapp" | "telegram" | "instagram";
  sender: string;
  text: string;
  timestamp: number;
  status: string;
  extractionBadge?: string;
};

type PendingMessagesListProps = {
  messages?: PendingMessageView[];
  totalUnread: number;
  isLoading: boolean;
  error?: Error | null;
};

const CHANNEL_META = {
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    className: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
  },
  instagram: {
    label: "Instagram",
    icon: Camera,
    className: "text-pink-700 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-300"
  }
} as const;

function PendingMessagesSkeleton() {
  return (
    <ul className="divide-border divide-y">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex gap-3 py-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PendingMessagesList({
  messages,
  totalUnread,
  isLoading,
  error
}: PendingMessagesListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Pending channel messages</CardTitle>
            <CardDescription>Latest inquiries from WhatsApp, Telegram, and Instagram</CardDescription>
          </div>
          {!isLoading && !error && totalUnread > 0 ? (
            <span className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
              {totalUnread} pending
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <PendingMessagesSkeleton />
        ) : error ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Unable to load messages
          </p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No pending messages — new webhook events will appear here.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {messages.map((message) => {
              const meta = CHANNEL_META[message.channel];
              const Icon = meta.icon;
              return (
                <li
                  key={message.id}
                  className="hover:bg-muted/50 -mx-2 flex gap-3 rounded-lg px-2 py-3 transition-colors"
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                      meta.className
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p className="truncate text-sm font-medium">{message.sender}</p>
                      <time
                        className="text-muted-foreground shrink-0 text-xs"
                        dateTime={new Date(message.timestamp).toISOString()}
                      >
                        {formatMessageTimestamp(message.timestamp)}
                      </time>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{meta.label}</p>
                    {message.extractionBadge ? (
                      <span className="bg-primary/10 text-primary mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
                        {message.extractionBadge}
                      </span>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-sm">
                      {truncateText(message.text, 60)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p
          className="text-muted-foreground mt-4 text-center text-xs"
          aria-disabled="true"
        >
          View all pending — coming in Week 3
        </p>
      </CardContent>
    </Card>
  );
}
