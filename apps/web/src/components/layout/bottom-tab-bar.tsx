"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, MOBILE_TAB_ITEMS } from "@/lib/shell-navigation";
import { cn } from "@/lib/utils";

type BottomTabBarProps = {
  className?: string;
};

export function BottomTabBar({ className }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "border-border bg-card safe-area-pb flex shrink-0 border-t px-1 py-1",
        className
      )}
      aria-label="Mobile navigation"
    >
      {MOBILE_TAB_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] px-1 text-[10px]",
              active ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
