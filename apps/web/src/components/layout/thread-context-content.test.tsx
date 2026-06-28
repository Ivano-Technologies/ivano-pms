import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ThreadContextContent } from "./thread-context-content";

import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

const thread: Doc<"inboxThread"> = {
  _id: "thread_1" as Id<"inboxThread">,
  _creationTime: 1,
  propertyId: "prop_1" as Id<"property">,
  channel: "telegram",
  threadKey: "tg:123",
  guestDisplayName: "Ada Okafor",
  lastMessagePreview: "Is A1 free next week?",
  lastMessageAt: Date.now(),
  unreadCount: 1,
  status: "new",
  bookingId: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

describe("ThreadContextContent", () => {
  it("shows guest and channel with no linked booking message", () => {
    render(<ThreadContextContent thread={thread} />);
    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText(/no linked booking/i)).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
  });

  it("shows linked booking summary when thread has bookingId", () => {
    render(
      <ThreadContextContent
        thread={{
          ...thread,
          bookingId: "booking_1" as Id<"booking">,
          status: "converted"
        }}
        bookingSummary={{
          checkInDate: "2026-07-01",
          checkOutDate: "2026-07-05",
          status: "confirmed"
        }}
      />
    );
    expect(screen.getByText(/linked booking/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-07-01/)).toBeInTheDocument();
  });
});
