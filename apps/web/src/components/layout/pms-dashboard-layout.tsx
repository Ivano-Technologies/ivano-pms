"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/guests", label: "Guests" },
  { href: "/dashboard/units", label: "Units" },
  { href: "/dashboard/channels", label: "Channels" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function PmsDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <aside className="border-border w-56 shrink-0 border-r p-4">
        <div className="mb-8 font-semibold">{BRAND_NAME}</div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-border flex items-center justify-between border-b px-6 py-4">
          <span className="text-muted-foreground text-sm">Manager dashboard</span>
          <UserButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
