"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getConvexUserMessage } from "@/lib/convex-error";
import {
  type CalendarUnit,
  addDays,
  countNights,
  formatMonthYear
} from "@/lib/calendar-utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type GuestOption = {
  _id: Id<"guest">;
  firstName: string;
  lastName: string;
};

type QuickCreateBookingModalProps = {
  isOpen: boolean;
  selectedDate: string;
  unitId: Id<"unit"> | null;
  onClose: () => void;
  guests: GuestOption[];
  units: CalendarUnit[];
};

export function QuickCreateBookingModal({
  isOpen,
  selectedDate,
  unitId,
  onClose,
  guests,
  units
}: QuickCreateBookingModalProps) {
  const createBooking = useMutation(api.functions.bookings.createBooking);
  const [guestId, setGuestId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [status, setStatus] = useState<
    "inquiry" | "pending_confirmation" | "confirmed"
  >("inquiry");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGuestId("");
      setSelectedUnitId(unitId ?? "");
      setStatus("inquiry");
      setCheckOutDate(addDays(selectedDate, 1));
    }
  }, [isOpen, selectedDate, unitId]);

  if (!isOpen) {
    return null;
  }

  const canSubmit = Boolean(guestId && selectedUnitId && !isSubmitting);
  const unit = units.find((u) => u._id === selectedUnitId);

  async function handleCreate() {
    if (!guestId || !selectedUnitId || !unit) {
      return;
    }

    const checkout = checkOutDate || addDays(selectedDate, 1);
    const nights = countNights(selectedDate, checkout);

    setIsSubmitting(true);
    try {
      await createBooking({
        guestId: guestId as Id<"guest">,
        unitId: selectedUnitId as Id<"unit">,
        checkInDate: selectedDate,
        checkOutDate: checkout,
        bookingType: "nightly",
        sourceChannel: "direct",
        totalPriceNgn: unit.pricePerNightNgn * nights,
        status
      });
      toast.success("Booking created");
      onClose();
    } catch (err) {
      toast.error(getConvexUserMessage(err, "Failed to create booking"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-booking-title"
    >
      <div className="bg-background border-border w-full max-w-lg rounded-xl border p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-booking-title" className="text-lg font-semibold">
              New booking
            </h2>
            <p className="text-muted-foreground text-sm">
              {formatMonthYear(selectedDate)} · Check-in {selectedDate}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Guest</span>
            <select
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={guestId}
              onChange={(e) => setGuestId(e.target.value)}
            >
              <option value="">Select guest</option>
              {guests.map((guest) => (
                <option key={guest._id} value={guest._id}>
                  {guest.firstName} {guest.lastName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Unit</span>
            <select
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
            >
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitNumber} ({u.unitType})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Check-out</span>
            <input
              type="date"
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              value={checkOutDate}
              min={addDays(selectedDate, 1)}
              onChange={(e) => setCheckOutDate(e.target.value)}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Status</legend>
            <div className="flex flex-wrap gap-3">
              {(
                ["inquiry", "pending_confirmation", "confirmed"] as const
              ).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={status === value}
                    onChange={() => setStatus(value)}
                  />
                  {value.replace("_", " ")}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void handleCreate()}>
            {isSubmitting ? "Creating…" : "Create booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}
