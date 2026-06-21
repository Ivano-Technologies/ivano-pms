"use client";

import { memo, useCallback, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  BOOKING_STATUS_COLORS,
  type BookingStatusKey
} from "@/lib/booking-status-colors";
import {
  type CalendarBooking,
  type CalendarUnit,
  addDays,
  formatDayHeader,
  getBookingSpanInWindow
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

export type { CalendarBooking };

export type BookingCalendarProps = {
  today: string;
  bookings: CalendarBooking[];
  units: CalendarUnit[];
  guestNames: Record<string, string>;
  onEmptyCellClick: (unitId: string, dayKey: string) => void;
  onBookingClick: (booking: CalendarBooking) => void;
  isLoading: boolean;
  error?: Error | null;
};

const DAY_COUNT = 30;

function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 6 }).map((_, row) => (
        <Skeleton key={row} className="h-14 w-full" />
      ))}
    </div>
  );
}

function BookingCalendarComponent({
  today,
  bookings,
  units,
  guestNames,
  onEmptyCellClick,
  onBookingClick,
  isLoading,
  error
}: BookingCalendarProps) {
  const windowDays = useMemo(() => {
    const keys: string[] = [];
    let current = today;
    for (let i = 0; i < DAY_COUNT; i += 1) {
      keys.push(current);
      current = addDays(current, 1);
    }
    return keys;
  }, [today]);

  const bookingsByUnit = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const unit of units) {
      map.set(
        unit._id,
        bookings.filter((b) => b.unitId === unit._id)
      );
    }
    return map;
  }, [bookings, units]);

  const handleEmptyClick = useCallback(
    (unitId: string, dayKey: string) => {
      onEmptyCellClick(unitId, dayKey);
    },
    [onEmptyCellClick]
  );

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Unable to load calendar
      </p>
    );
  }

  const totalRows = units.length + 1;

  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <div
        className="grid min-w-[960px]"
        style={{
          gridTemplateColumns: `8rem repeat(${DAY_COUNT}, minmax(2.75rem, 1fr))`,
          gridTemplateRows: `repeat(${totalRows}, minmax(3.5rem, auto))`
        }}
      >
        <div
          className="border-border bg-muted/40 sticky left-0 z-20 border-b border-r px-3 py-2 text-xs font-medium"
          style={{ gridRow: 1, gridColumn: 1 }}
        >
          Unit
        </div>
        {windowDays.map((dayKey, index) => (
          <div
            key={dayKey}
            style={{ gridRow: 1, gridColumn: index + 2 }}
            className={cn(
              "border-border border-b px-1 py-2 text-center text-xs",
              dayKey === today && "bg-blue-50 ring-1 ring-blue-400 ring-inset dark:bg-blue-950/30"
            )}
          >
            {formatDayHeader(dayKey)}
          </div>
        ))}

        {units.map((unit, unitIndex) => {
          const row = unitIndex + 2;
          const unitBookings = bookingsByUnit.get(unit._id) ?? [];
          const spans = unitBookings
            .map((booking) => ({
              booking,
              span: getBookingSpanInWindow(booking, windowDays)
            }))
            .filter(
              (
                item
              ): item is {
                booking: CalendarBooking;
                span: { dayStartIndex: number; span: number };
              } => item.span !== null
            );

          const coveredDays = new Set<number>();
          for (const { span } of spans) {
            for (let i = 0; i < span.span; i += 1) {
              coveredDays.add(span.dayStartIndex + i);
            }
          }

          return (
            <div key={unit._id} className="contents">
              <div
                className="border-border bg-background sticky left-0 z-10 flex flex-col justify-center border-r px-3 py-2"
                style={{ gridRow: row, gridColumn: 1 }}
              >
                <span className="text-sm font-medium">{unit.unitNumber}</span>
                <span className="text-muted-foreground text-xs capitalize">
                  {unit.unitType}
                </span>
              </div>

              {windowDays.map((dayKey, dayIndex) => {
                if (coveredDays.has(dayIndex)) {
                  return (
                    <div
                      key={`${unit._id}-${dayKey}-bg`}
                      style={{ gridRow: row, gridColumn: dayIndex + 2 }}
                      className={cn(
                        "border-border border-b border-r",
                        dayKey === today && "bg-blue-50/30 dark:bg-blue-950/10"
                      )}
                    />
                  );
                }

                return (
                  <button
                    key={`${unit._id}-${dayKey}`}
                    type="button"
                    style={{ gridRow: row, gridColumn: dayIndex + 2 }}
                    onClick={() => handleEmptyClick(unit._id, dayKey)}
                    className={cn(
                      "border-border hover:bg-muted/60 min-h-14 border-b border-r transition-colors",
                      dayKey === today && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    aria-label={`Create booking for ${unit.unitNumber} on ${dayKey}`}
                  />
                );
              })}

              {spans.map(({ booking, span }) => {
                const colors =
                  BOOKING_STATUS_COLORS[booking.status as BookingStatusKey] ??
                  BOOKING_STATUS_COLORS.inquiry;
                const guest = guestNames[booking.guestId] ?? "Guest";
                return (
                  <button
                    key={booking._id}
                    type="button"
                    style={{
                      gridRow: row,
                      gridColumn: `${span.dayStartIndex + 2} / span ${span.span}`,
                      zIndex: 5
                    }}
                    onClick={() => onBookingClick(booking)}
                    className={cn(
                      "border m-0.5 flex min-h-12 items-center truncate rounded-md border px-2 py-1 text-left text-xs font-medium self-center",
                      colors
                    )}
                    title={`${guest} · ${booking.checkInDate}${booking.checkOutDate ? ` → ${booking.checkOutDate}` : ""}`}
                  >
                    {guest}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const BookingCalendar = memo(BookingCalendarComponent);
