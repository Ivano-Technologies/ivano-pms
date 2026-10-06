import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  CalendarCheck,
  CircleCheck,
  CircleHelp,
  CircleX,
  Hourglass,
  LogIn,
  LogOut
} from "lucide-react";

/**
 * Locked Week 2 statuses mapped to the Lobby Light status tokens (BRAND-SYSTEM §1).
 * Colour is never the only signal: pair every chip or ribbon with BOOKING_STATUS_META icon + label.
 */
export const BOOKING_STATUS_COLORS = {
  inquiry:
    "bg-status-inquiry-bg text-status-inquiry-fg border border-dashed border-status-inquiry-line",
  pending_confirmation: "bg-status-pending-bg text-status-pending-fg border border-transparent",
  confirmed:
    "bg-status-confirmed-bg text-status-confirmed-fg border border-status-confirmed-line",
  checked_in: "bg-status-inhouse-bg text-status-inhouse-fg border border-transparent",
  checked_out: "bg-status-checkedout-bg text-status-checkedout-fg border border-transparent",
  completed: "bg-status-completed-bg text-status-completed-fg border border-transparent",
  cancelled: "bg-status-cancelled-bg text-status-cancelled-fg border border-transparent line-through"
} as const;

export type BookingStatusKey = keyof typeof BOOKING_STATUS_COLORS;

/** Display only state for a confirmed stay whose check in is today. */
export const ARRIVING_TODAY_CLASS = "bg-terracotta text-white border border-transparent";

export const BOOKING_STATUS_META: Record<
  BookingStatusKey,
  { label: string; icon: LucideIcon }
> = {
  inquiry: { label: "Inquiry", icon: CircleHelp },
  pending_confirmation: { label: "Awaiting confirmation", icon: Hourglass },
  confirmed: { label: "Confirmed", icon: CalendarCheck },
  checked_in: { label: "In house", icon: BedDouble },
  checked_out: { label: "Checked out", icon: LogOut },
  completed: { label: "Completed", icon: CircleCheck },
  cancelled: { label: "Cancelled", icon: CircleX }
};

export const ARRIVING_TODAY_META = { label: "Arriving today", icon: LogIn } as const;

/** Ribbon/chip styling for a display state, including the derived "arriving" state. */
export type StayDisplayState = BookingStatusKey | "arriving";

export function stayStateClass(state: StayDisplayState): string {
  return state === "arriving" ? ARRIVING_TODAY_CLASS : BOOKING_STATUS_COLORS[state];
}

export function stayStateMeta(state: StayDisplayState): { label: string; icon: LucideIcon } {
  return state === "arriving" ? ARRIVING_TODAY_META : BOOKING_STATUS_META[state];
}
