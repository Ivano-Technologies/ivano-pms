"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BOOKING_STATUS_COLORS,
  type BookingStatusKey
} from "@/lib/booking-status-colors";
import { formatNgn } from "@/lib/format";
import { cn } from "@/lib/utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type BookingContextContentProps = {
  bookingId: Id<"booking">;
  onOpenChecklist: () => void;
  onGuestLoaded?: (guestName: string) => void;
};

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function BookingContextContent({
  bookingId,
  onOpenChecklist,
  onGuestLoaded
}: BookingContextContentProps) {
  const booking = useQuery(api.functions.bookings.getBookingById, { bookingId });

  useEffect(() => {
    if (booking?.guestName) {
      onGuestLoaded?.(booking.guestName);
    }
  }, [booking?.guestName, onGuestLoaded]);

  if (booking === undefined) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const status = booking.status as BookingStatusKey;
  const colors = BOOKING_STATUS_COLORS[status] ?? BOOKING_STATUS_COLORS.inquiry;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Guest
        </p>
        <p className="font-semibold">{booking.guestName}</p>
        {booking.guestPhone ? (
          <p className="text-muted-foreground text-sm">{booking.guestPhone}</p>
        ) : null}
        {booking.guestEmail ? (
          <p className="text-muted-foreground text-sm">{booking.guestEmail}</p>
        ) : null}
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Unit</dt>
          <dd>
            {booking.unitNumber} ({booking.unitType})
          </dd>
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
              {formatStatusLabel(status)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Channel</dt>
          <dd className="capitalize">{booking.sourceChannel.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Price</dt>
          <dd>{formatNgn(booking.totalPriceNgn)}</dd>
        </div>
      </dl>

      <Button type="button" className="w-full" onClick={onOpenChecklist}>
        Open checklist
      </Button>
    </div>
  );
}
