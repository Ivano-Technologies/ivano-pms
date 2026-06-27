"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive, SHELL_NAV_ITEMS } from "@/lib/shell-navigation";
import { cn } from "@/lib/utils";

type NavRailProps = {
  className?: string;
};

export function NavRail({ className }: NavRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "border-border bg-card w-56 shrink-0 border-r p-3",
        className
      )}
      aria-label="Main navigation"
    >
      <nav className="space-y-1">
        {SHELL_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
