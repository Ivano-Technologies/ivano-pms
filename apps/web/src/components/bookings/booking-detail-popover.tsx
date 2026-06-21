"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BOOKING_STATUS_COLORS,
  type BookingStatusKey
} from "@/lib/booking-status-colors";
import { getTransitionLabel } from "@/lib/booking-states";
import { formatNgn, formatMessageTimestamp } from "@/lib/format";
import type { CalendarBooking } from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type BookingDetailPopoverProps = {
  booking: CalendarBooking | null;
  guestName: string;
  onClose: () => void;
};

type TabId = "details" | "history";

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function BookingDetailPopover({
  booking,
  guestName,
  onClose
}: BookingDetailPopoverProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [pendingStatus, setPendingStatus] = useState<BookingStatusKey | null>(
    null
  );

  const bookingId = booking?._id as Id<"booking"> | undefined;

  const bookingDetails = useQuery(
    api.functions.bookings.getBookingById,
    bookingId ? { bookingId } : "skip"
  );

  const auditTrail = useQuery(
    api.functions.bookings.getBookingAuditTrail,
    bookingId ? { bookingId } : "skip"
  );

  const availableTransitions = useQuery(
    api.functions.bookings.getBookingStatusTransitions,
    bookingDetails ? { status: bookingDetails.status } : "skip"
  );

  const updateStatus = useMutation(api.functions.bookings.updateBookingStatus);

  const display = bookingDetails ?? booking;
  const displayGuestName = bookingDetails?.guestName ?? guestName;
  const currentStatus = (display?.status ?? "inquiry") as BookingStatusKey;

  const colors =
    BOOKING_STATUS_COLORS[currentStatus] ?? BOOKING_STATUS_COLORS.inquiry;

  const transitionButtons = useMemo(() => {
    if (!availableTransitions) {
      return [];
    }
    return availableTransitions.map((nextStatus) => ({
      status: nextStatus as BookingStatusKey,
      label: getTransitionLabel(currentStatus, nextStatus as BookingStatusKey)
    }));
  }, [availableTransitions, currentStatus]);

  if (!booking || !display) {
    return null;
  }

  const handleTransition = async (newStatus: BookingStatusKey) => {
    if (!bookingId) {
      return;
    }

    const label = getTransitionLabel(currentStatus, newStatus);
    const confirmed = window.confirm(
      `Confirm ${label.toLowerCase()} for ${displayGuestName}?`
    );
    if (!confirmed) {
      return;
    }

    setPendingStatus(newStatus);
    try {
      await updateStatus({
        bookingId,
        newStatus,
        reason: undefined
      });
      toast.success(`Booking ${formatStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update booking"
      );
    } finally {
      setPendingStatus(null);
    }
  };

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
          <h3 className="text-lg font-semibold">
            Booking #{String(bookingId).slice(-6)}
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg border p-1">
          {(["details", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "details" ? (
          <>
            {transitionButtons.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {transitionButtons.map(({ status, label }) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={status === "cancelled" ? "outline" : "default"}
                    disabled={pendingStatus !== null}
                    onClick={() => void handleTransition(status)}
                  >
                    {pendingStatus === status ? "Updating…" : label}
                  </Button>
                ))}
              </div>
            ) : null}

            {bookingDetails === undefined ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Guest</dt>
                  <dd className="font-medium">{displayGuestName}</dd>
                  {bookingDetails.guestPhone ? (
                    <dd className="text-muted-foreground">{bookingDetails.guestPhone}</dd>
                  ) : null}
                  {bookingDetails.guestEmail ? (
                    <dd className="text-muted-foreground">{bookingDetails.guestEmail}</dd>
                  ) : null}
                </div>
                <div>
                  <dt className="text-muted-foreground">Unit</dt>
                  <dd>
                    {bookingDetails.unitNumber} ({bookingDetails.unitType})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Dates</dt>
                  <dd>
                    {display.checkInDate}
                    {display.checkOutDate
                      ? ` → ${display.checkOutDate}`
                      : " (open)"}
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
                      {formatStatusLabel(currentStatus)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Channel</dt>
                  <dd className="capitalize">
                    {display.sourceChannel.replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Price</dt>
                  <dd>{formatNgn(bookingDetails.totalPriceNgn)}</dd>
                </div>
                {bookingDetails.notes ? (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd>{bookingDetails.notes}</dd>
                  </div>
                ) : null}
              </dl>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {auditTrail === undefined ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : auditTrail.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No status history yet.
              </p>
            ) : (
              <ul className="divide-border divide-y text-sm">
                {auditTrail.map((entry) => {
                  const newStatus =
                    typeof entry.newValues === "object" &&
                    entry.newValues !== null &&
                    "status" in entry.newValues &&
                    typeof entry.newValues.status === "string"
                      ? entry.newValues.status
                      : "updated";
                  const reason =
                    typeof entry.newValues === "object" &&
                    entry.newValues !== null &&
                    "reason" in entry.newValues &&
                    typeof entry.newValues.reason === "string"
                      ? entry.newValues.reason
                      : null;

                  return (
                    <li key={entry._id} className="py-2">
                      <p>
                        <span className="font-medium">
                          {entry.actorName ?? "Manager"}
                        </span>{" "}
                        changed status to{" "}
                        <span className="font-medium capitalize">
                          {formatStatusLabel(newStatus)}
                        </span>{" "}
                        on {formatMessageTimestamp(entry.createdAt)}
                        {reason ? ` — ${reason}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
