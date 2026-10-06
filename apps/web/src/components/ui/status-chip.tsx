import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusChipTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE_CLASSES: Record<StatusChipTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  brand: "border-terracotta/30 bg-terracotta-tint text-terracotta-hover",
  success: "border-sage/40 bg-status-completed-bg text-status-completed-fg",
  warning: "border-brass/50 bg-warning text-warning-foreground",
  danger: "border-rose/40 bg-status-cancelled-bg text-status-cancelled-fg",
  info: "border-[#245A80]/30 bg-info text-info-foreground"
};

export function StatusChip({
  children,
  tone = "neutral",
  icon: Icon,
  className
}: {
  children: ReactNode;
  tone?: StatusChipTone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      role="status"
      data-tone={tone}
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-[var(--radius)] border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      {children}
    </span>
  );
}
