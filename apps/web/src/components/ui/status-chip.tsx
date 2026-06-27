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
  neutral:
    "border-border bg-muted text-foreground",
  brand:
    "border-primary/30 bg-primary/10 text-primary",
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  warning:
    "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  danger:
    "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100",
  info:
    "border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100"
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
