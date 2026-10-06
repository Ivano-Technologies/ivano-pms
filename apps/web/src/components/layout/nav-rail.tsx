"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";
import { isNavItemActive, SHELL_NAV_ITEMS } from "@/lib/shell-navigation";
import { cn } from "@/lib/utils";

type NavRailProps = {
  className?: string;
};

/** Navy sidebar with the reverse IV1 + PMS lockup (Wave 1 colours; layout work is Wave 2). */
export function NavRail({ className }: NavRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border w-56 shrink-0 flex-col border-r p-3",
        className
      )}
      aria-label="Main navigation"
      data-surface="ink"
    >
      <Link href="/dashboard" aria-label="Ivano PMS dashboard" className="mb-4 block rounded-md px-2 pt-1 pb-2">
        <IvanoPmsLockup tone="navy" title={null} className="h-9" />
      </Link>
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
                "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold before:bg-sidebar-primary before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-[3px]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
