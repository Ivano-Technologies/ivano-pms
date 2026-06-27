import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { BookingContextPanel } from "./booking-context-panel";
import { ChecklistSlideOver } from "./checklist-slide-over";
import { ThreadContextContent } from "./thread-context-content";

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

const sampleThread = {
  _id: "thread_demo",
  _creationTime: 1,
  propertyId: "prop_demo",
  channel: "telegram" as const,
  threadKey: "tg:demo",
  guestDisplayName: "Ada Okafor",
  lastMessagePreview: "Is studio A1 free 1–5 July?",
  lastMessageAt: Date.now(),
  unreadCount: 2,
  status: "new" as const,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const ThreadContext: StoryObj = {
  render: () => <ThreadContextContent thread={sampleThread} />
};

export const ThreadWithBooking: StoryObj = {
  render: () => (
    <ThreadContextContent
      thread={{ ...sampleThread, bookingId: "booking_demo" as never, status: "converted" }}
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
        bookingId={"booking_demo" as never}
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
      <BookingContextPanel bookingId={"booking_demo" as never} guestName="Ada Okafor" />
    </div>
  )
};
