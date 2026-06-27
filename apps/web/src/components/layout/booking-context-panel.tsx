"use client";

import { useState } from "react";

import { BookingContextContent } from "./booking-context-content";
import { ChecklistSlideOver } from "./checklist-slide-over";

import type { Id } from "../../../../../convex/_generated/dataModel";

type BookingContextPanelProps = {
  bookingId: Id<"booking">;
  guestName?: string;
};

export function BookingContextPanel({
  bookingId,
  guestName = "Guest"
}: BookingContextPanelProps) {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [resolvedGuestName, setResolvedGuestName] = useState(guestName);

  return (
    <>
      <BookingContextContent
        bookingId={bookingId}
        onOpenChecklist={() => setChecklistOpen(true)}
        onGuestLoaded={setResolvedGuestName}
      />
      <ChecklistSlideOver
        bookingId={bookingId}
        guestName={resolvedGuestName}
        open={checklistOpen}
        onClose={() => setChecklistOpen(false)}
      />
    </>
  );
}
