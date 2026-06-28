import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { BookingContextPanel } from "./booking-context-panel";
import { ChecklistSlideOver } from "./checklist-slide-over";
import { ThreadContextContent } from "./thread-context-content";

import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const meta = {
  title: "Shell/C. Phase",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase C: booking/guest context panel content, thread summary for inbox, and checklist slide-over."
      }
    }
  }
} satisfies Meta;

export default meta;

const sampleThread: Doc<"inboxThread"> = {
  _id: "thread_demo" as Id<"inboxThread">,
  _creationTime: 1,
  propertyId: "prop_demo" as Id<"property">,
  channel: "telegram",
  threadKey: "tg:demo",
  guestDisplayName: "Ada Okafor",
  lastMessagePreview: "Is studio A1 free 1–5 July?",
  lastMessageAt: Date.now(),
  unreadCount: 2,
  status: "new",
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const sampleBookingId = "booking_demo" as Id<"booking">;

export const ThreadContext: StoryObj = {
  render: () => <ThreadContextContent thread={sampleThread} />
};

export const ThreadWithBooking: StoryObj = {
  render: () => (
    <ThreadContextContent
      thread={{ ...sampleThread, bookingId: sampleBookingId, status: "converted" }}
      bookingSummary={{
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-05",
        status: "confirmed"
      }}
    />
  )
};

export const ChecklistSlideOverOpen: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <ChecklistSlideOver
        bookingId={sampleBookingId}
        guestName="Ada Okafor"
        open={open}
        onClose={() => setOpen(false)}
      />
    );
  },
  parameters: { layout: "fullscreen" }
};

export const BookingContext: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <BookingContextPanel bookingId={sampleBookingId} guestName="Ada Okafor" />
    </div>
  )
};
