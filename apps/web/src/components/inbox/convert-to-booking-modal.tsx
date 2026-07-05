"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { getConvexUserMessage } from "@/lib/convex-error";
import { usePropertyScope } from "@/components/layout/property-context";
import { formatNgn } from "@/lib/unit-utils";
import { inputClassName } from "@/lib/unit-utils";

type BookingType = "nightly" | "weekly" | "monthly" | "lease";

type ConvertToBookingModalProps = {
  message: Doc<"bookingChannelMessage"> | null;
  isOpen: boolean;
  onClose: () => void;
};

function calcTotalPrice(
  checkIn: string,
  checkOut: string,
  pricePerNight: number
): number {
  if (!checkIn || !checkOut) return 0;
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  return nights * pricePerNight;
}

export function ConvertToBookingModal({
  message,
  isOpen,
  onClose
}: ConvertToBookingModalProps) {
  const { propertyArgs } = usePropertyScope();
  const guests = useQuery(api.functions.guests.getGuests, propertyArgs);
  const units = useQuery(api.functions.units.getUnits, propertyArgs);
  const convert = useMutation(api.functions.channelMessages.convertChannelMessageToBooking);

  const [guestId, setGuestId] = useState<Id<"guest"> | "">("");
  const [unitId, setUnitId] = useState<Id<"unit"> | "">("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("nightly");
  const [totalPriceNgn, setTotalPriceNgn] = useState(0);
  const [saving, setSaving] = useState(false);

  const guestRef = useRef<HTMLSelectElement>(null);

  const selectedUnit = units?.find((u) => u._id === unitId);

  useEffect(() => {
    if (isOpen && message) {
      setGuestId("");
      setUnitId("");
      setCheckInDate(message.extractedCheckIn ?? "");
      setCheckOutDate(message.extractedCheckOut ?? "");
      setBookingType("nightly");
      setTotalPriceNgn(0);
      setTimeout(() => guestRef.current?.focus(), 50);
    }
  }, [isOpen, message]);

  useEffect(() => {
    if (selectedUnit && checkInDate && checkOutDate) {
      setTotalPriceNgn(
        calcTotalPrice(checkInDate, checkOutDate, selectedUnit.pricePerNightNgn)
      );
    }
  }, [checkInDate, checkOutDate, selectedUnit]);

  if (!isOpen || !message) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestId || !unitId || !checkInDate) {
      toast.error("Guest, unit, and check-in date are required");
      return;
    }
    setSaving(true);
    try {
      await convert({
        messageId: message!._id,
        guestId: guestId as Id<"guest">,
        unitId: unitId as Id<"unit">,
        checkInDate,
        checkOutDate: checkOutDate || undefined,
        bookingType,
        totalPriceNgn
      });
      toast.success("Booking created");
      onClose();
    } catch (err) {
      toast.error(getConvexUserMessage(err, "Failed to create booking"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-background relative z-10 w-full max-w-md rounded-xl p-6 shadow-xl">
        <h2 id="convert-modal-title" className="mb-1 text-lg font-semibold">
          Convert to booking
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          From: <span className="font-medium">{message.senderName}</span> —{" "}
          {message.messageText.slice(0, 60)}
          {message.messageText.length > 60 ? "…" : ""}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div>
            <label htmlFor="conv-guest" className="mb-1 block text-sm font-medium">
              Guest <span aria-hidden="true">*</span>
            </label>
            <select
              id="conv-guest"
              ref={guestRef}
              required
              className={inputClassName}
              value={guestId}
              onChange={(e) => setGuestId(e.target.value as Id<"guest">)}
            >
              <option value="">Select a guest…</option>
              {guests?.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.firstName} {g.lastName} · {g.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="conv-unit" className="mb-1 block text-sm font-medium">
              Unit <span aria-hidden="true">*</span>
            </label>
            <select
              id="conv-unit"
              required
              className={inputClassName}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value as Id<"unit">)}
            >
              <option value="">Select a unit…</option>
              {units?.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitNumber} ({u.unitType}) — {formatNgn(u.pricePerNightNgn)}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="conv-checkin" className="mb-1 block text-sm font-medium">
                Check-in <span aria-hidden="true">*</span>
              </label>
              <input
                id="conv-checkin"
                type="date"
                required
                className={inputClassName}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="conv-checkout" className="mb-1 block text-sm font-medium">
                Check-out
              </label>
              <input
                id="conv-checkout"
                type="date"
                className={inputClassName}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="conv-type" className="mb-1 block text-sm font-medium">
                Booking type
              </label>
              <select
                id="conv-type"
                className={inputClassName}
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as BookingType)}
              >
                <option value="nightly">Nightly</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="lease">Lease</option>
              </select>
            </div>
            <div>
              <label htmlFor="conv-price" className="mb-1 block text-sm font-medium">
                Total price (NGN)
              </label>
              <input
                id="conv-price"
                type="number"
                min={0}
                step={500}
                className={inputClassName}
                value={totalPriceNgn}
                onChange={(e) => setTotalPriceNgn(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !guestId || !unitId || !checkInDate}
              aria-busy={saving}
            >
              {saving ? "Creating…" : "Create booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
