"use client";

import { useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

import { BookingCalendar, type CalendarBooking } from "@/components/bookings/booking-calendar";
import { BookingDetailPopover } from "@/components/bookings/booking-detail-popover";
import { QuickCreateBookingModal } from "@/components/bookings/quick-create-booking-modal";
import { usePropertyScope } from "@/components/layout/property-context";
import { addDays, getDayKey } from "@/lib/calendar-utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** Target: calendar interactive in under 2s on localhost with seed data. */
export function BookingsCalendarView() {
  const today = useMemo(() => getDayKey(new Date()), []);
  const windowEnd = useMemo(() => addDays(today, 29), [today]);
  const { propertyArgs } = usePropertyScope();

  const manager = useQuery(api.functions.managers.getCurrentManagerProfile);
  const canQuery = manager !== undefined && manager !== null;

  const bookings = useQuery(
    api.functions.bookings.getBookingsByDateRange,
    canQuery ? { startDate: today, endDate: windowEnd, ...propertyArgs } : "skip"
  );

  const units = useQuery(
    api.functions.units.getUnits,
    canQuery ? { ...propertyArgs } : "skip"
  );
  const guests = useQuery(
    api.functions.guests.getGuests,
    canQuery ? { ...propertyArgs } : "skip"
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedUnitId, setSelectedUnitId] = useState<Id<"unit"> | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(
    null
  );

  const calendarBookings = useMemo(
    () =>
      (bookings ?? []).map((b) => ({
        _id: b._id,
        unitId: b.unitId,
        guestId: b.guestId,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
        sourceChannel: b.sourceChannel
      })),
    [bookings]
  );

  const calendarUnits = useMemo(
    () =>
      (units ?? [])
        .map((u) => ({
          _id: u._id,
          unitNumber: u.unitNumber,
          unitType: u.unitType,
          pricePerNightNgn: u.pricePerNightNgn
        }))
        .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)),
    [units]
  );

  const guestNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const guest of guests ?? []) {
      map[guest._id] = `${guest.firstName} ${guest.lastName}`;
    }
    return map;
  }, [guests]);

  const handleEmptyCellClick = useCallback((unitId: string, dayKey: string) => {
    setSelectedUnitId(unitId as Id<"unit">);
    setSelectedDate(dayKey);
    setModalOpen(true);
  }, []);

  const handleBookingClick = useCallback((booking: CalendarBooking) => {
    setSelectedBooking(booking);
  }, []);

  const isLoading =
    !canQuery ||
    bookings === undefined ||
    units === undefined ||
    guests === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          30-day view · click an empty cell to create an inquiry
        </p>
      </div>

      <BookingCalendar
        today={today}
        bookings={calendarBookings}
        units={calendarUnits}
        guestNames={guestNames}
        onEmptyCellClick={handleEmptyCellClick}
        onBookingClick={handleBookingClick}
        isLoading={isLoading}
        error={manager === null ? new Error("Manager not found") : null}
      />

      <QuickCreateBookingModal
        isOpen={modalOpen}
        selectedDate={selectedDate}
        unitId={selectedUnitId}
        onClose={() => setModalOpen(false)}
        guests={guests ?? []}
        units={calendarUnits}
      />

      <BookingDetailPopover
        booking={selectedBooking}
        guestName={
          selectedBooking ? (guestNames[selectedBooking.guestId] ?? "Guest") : ""
        }
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
