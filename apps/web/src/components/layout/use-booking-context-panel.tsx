"use client";

import { useCallback } from "react";

import { BookingContextPanel } from "./booking-context-panel";
import { useContextPanel } from "./context-panel";
import { ThreadContextContent } from "./thread-context-content";

import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

type ThreadBookingSummary = {
  checkInDate: string;
  checkOutDate?: string;
  status: string;
};

export function useBookingContextPanel() {
  const panel = useContextPanel();

  const showBooking = useCallback(
    (bookingId: Id<"booking">, guestName?: string) => {
      panel.setTitle(guestName ?? "Booking");
      panel.setContent(
        <BookingContextPanel bookingId={bookingId} guestName={guestName} />
      );
      panel.setOpen(true);
    },
    [panel]
  );

  const showThread = useCallback(
    (
      thread: Doc<"inboxThread">,
      bookingSummary?: ThreadBookingSummary | null
    ) => {
      panel.setTitle(thread.guestDisplayName);
      if (thread.bookingId) {
        panel.setContent(
          <BookingContextPanel
            bookingId={thread.bookingId}
            guestName={thread.guestDisplayName}
          />
        );
      } else {
        panel.setContent(
          <ThreadContextContent thread={thread} bookingSummary={bookingSummary} />
        );
      }
      panel.setOpen(true);
    },
    [panel]
  );

  const close = useCallback(() => {
    panel.setOpen(false);
  }, [panel]);

  return { showBooking, showThread, close };
}
