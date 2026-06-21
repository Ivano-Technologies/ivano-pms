"use client";

import { Button } from "@/components/ui/button";
import {
  BOOKING_STATUS_COLORS,
  type BookingStatusKey
} from "@/lib/booking-status-colors";
import type { CalendarBooking } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

type BookingDetailPopoverProps = {
  booking: CalendarBooking | null;
  guestName: string;
  onClose: () => void;
};

export function BookingDetailPopover({
  booking,
  guestName,
  onClose
}: BookingDetailPopoverProps) {
  if (!booking) {
    return null;
  }

  const colors =
    BOOKING_STATUS_COLORS[booking.status as BookingStatusKey] ??
    BOOKING_STATUS_COLORS.inquiry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-background border-border w-full max-w-md rounded-xl border p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">Booking details</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Guest</dt>
            <dd className="font-medium">{guestName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dates</dt>
            <dd>
              {booking.checkInDate}
              {booking.checkOutDate ? ` → ${booking.checkOutDate}` : " (open)"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                  colors
                )}
              >
                {booking.status.replace("_", " ")}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Channel</dt>
            <dd className="capitalize">{booking.sourceChannel.replace("_", " ")}</dd>
          </div>
        </dl>

        <p className="text-muted-foreground mt-4 text-xs">
          Full edit and status transitions — Week 3
        </p>
      </div>
    </div>
  );
}
