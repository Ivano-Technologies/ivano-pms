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

export function formatMessageExtractionBadge(message: {
  extractedCheckIn?: string;
  extractedCheckOut?: string;
  extractedGuestNames?: string[];
  extractedUnitType?: string;
}): string | undefined {
  const parts: string[] = [];

  if (message.extractedCheckIn && message.extractedCheckOut) {
    const checkIn = formatShortIsoDate(message.extractedCheckIn);
    const checkOut = formatShortIsoDate(message.extractedCheckOut);
    parts.push(`${checkIn}–${checkOut}`);
  } else if (message.extractedCheckIn) {
    parts.push(formatShortIsoDate(message.extractedCheckIn));
  }

  if (message.extractedUnitType) {
    parts.push(message.extractedUnitType);
  }

  if (message.extractedGuestNames?.[0]) {
    parts.push(message.extractedGuestNames[0]);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function formatShortIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

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
