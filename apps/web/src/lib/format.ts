const ngnFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function formatNgn(amount: number): string {
  return ngnFormatter.format(amount);
}

export function formatOccupancyRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatMessageTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

/** Bookings in non-terminal pipeline statuses. */
export function countActiveBookings(
  bookingCountByStatus: Record<string, number>
): number {
  const activeStatuses = [
    "inquiry",
    "pending_confirmation",
    "confirmed",
    "checked_in"
  ] as const;
  return activeStatuses.reduce(
    (sum, status) => sum + (bookingCountByStatus[status] ?? 0),
    0
  );
}
