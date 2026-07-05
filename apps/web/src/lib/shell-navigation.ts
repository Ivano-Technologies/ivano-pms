import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Calendar,
  Inbox,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";

export type ShellNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar (architecture caps at five). */
  mobilePrimary?: boolean;
  hint?: string;
};

/**
 * Single source of truth for shell navigation.
 *
 * Route notes (current app):
 * - Inbox is at /dashboard/inbox (/dashboard/channels redirects here).
 * - Telegram + Email inbound cards live under Settings → Connected channels.
 * - Bulk import button lives on Guests page header (not a top-level nav item).
 */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  {
    id: "inbox",
    label: "Inbox",
    href: "/dashboard/inbox",
    icon: Inbox,
    mobilePrimary: true,
    hint: "Guest threads"
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: Calendar,
    mobilePrimary: true,
    hint: "Calendar"
  },
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    hint: "Dashboard summary"
  },
  {
    id: "guests",
    label: "Guests",
    href: "/dashboard/guests",
    icon: Users,
    mobilePrimary: true,
    hint: "Import spreadsheet"
  },
  {
    id: "units",
    label: "Units",
    href: "/dashboard/units",
    icon: Building2,
    hint: "Rooms and rates"
  },
  {
    id: "reports",
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    mobilePrimary: true,
    hint: "Occupancy and revenue"
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    mobilePrimary: true,
    hint: "Channels · Telegram · Email"
  }
];

export const MOBILE_TAB_ITEMS = SHELL_NAV_ITEMS.filter((item) => item.mobilePrimary);

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
