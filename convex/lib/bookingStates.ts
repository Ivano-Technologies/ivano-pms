export const BOOKING_STATUSES = [
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "checked_in",
  "checked_out",
  "completed",
  "cancelled"
] as const;

export type BookingStatusType = (typeof BOOKING_STATUSES)[number];

const TRANSITIONS: Record<BookingStatusType, readonly BookingStatusType[]> = {
  inquiry: ["pending_confirmation", "confirmed", "cancelled"],
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out", "cancelled"],
  checked_out: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

const TRANSITION_LABELS: Partial<
  Record<BookingStatusType, Partial<Record<BookingStatusType, string>>>
> = {
  inquiry: {
    pending_confirmation: "Mark Pending",
    confirmed: "Confirm",
    cancelled: "Cancel Booking"
  },
  pending_confirmation: {
    confirmed: "Confirm",
    cancelled: "Cancel Booking"
  },
  confirmed: {
    checked_in: "Check In",
    cancelled: "Cancel Booking"
  },
  checked_in: {
    checked_out: "Check Out",
    cancelled: "Cancel Booking"
  },
  checked_out: {
    completed: "Complete",
    cancelled: "Cancel Booking"
  }
};

export function isValidTransition(
  from: BookingStatusType,
  to: BookingStatusType
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getAvailableTransitions(
  current: BookingStatusType
): BookingStatusType[] {
  return [...TRANSITIONS[current]];
}

export function getTransitionLabel(
  from: BookingStatusType,
  to: BookingStatusType
): string {
  return TRANSITION_LABELS[from]?.[to] ?? `Move to ${to.replaceAll("_", " ")}`;
}
