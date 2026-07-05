import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Calendar,
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
 * - Channel features (Inbox, Telegram, Email inbound) are deferred post-launch
 *   and intentionally removed from navigation to keep the app simple.
 * - Bulk import button lives on Guests page header (not a top-level nav item).
 */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    mobilePrimary: true,
    hint: "Dashboard summary"
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
    hint: "Property configuration"
  }
];

export const MOBILE_TAB_ITEMS = SHELL_NAV_ITEMS.filter((item) => item.mobilePrimary);

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
