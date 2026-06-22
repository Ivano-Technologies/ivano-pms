import { formatDistanceToNow } from "date-fns";

export type MessageStatus = "new" | "reviewed" | "converted" | "archived";
export type MessageChannel = "whatsapp" | "telegram" | "instagram";

export const CHANNEL_META: Record<
  MessageChannel,
  { label: string; badgeClass: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    badgeClass:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
  },
  telegram: {
    label: "Telegram",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
  },
  instagram: {
    label: "Instagram",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
  }
};

export const STATUS_FILTER_OPTIONS: {
  value: MessageStatus | "all";
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" }
];

export function formatRelativeTime(createdAt: number): string {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
}

export function truncateMessage(text: string, len = 120): string {
  if (text.length <= len) return text;
  return text.slice(0, len).trimEnd() + "…";
}

export function isUnread(status: MessageStatus): boolean {
  return status === "new";
}
