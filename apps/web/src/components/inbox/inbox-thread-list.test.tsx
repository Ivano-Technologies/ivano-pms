import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { InboxThreadList } from "./inbox-thread-list";

const thread = {
  _id: "thread_whatsapp_1" as Id<"inboxThread">,
  _creationTime: 1,
  propertyId: "property_1" as Id<"property">,
  channel: "whatsapp",
  threadKey: "wa:+234801",
  guestDisplayName: "Ada Okonkwo",
  senderPhone: "+234801",
  lastMessagePreview: "Need a room Friday",
  lastMessageAt: Date.now(),
  unreadCount: 2,
  status: "new",
  createdAt: Date.now(),
  updatedAt: Date.now()
} as Doc<"inboxThread">;

describe("InboxThreadList", () => {
  it("renders guest threads and reports selection", () => {
    const onSelect = vi.fn();
    render(
      <InboxThreadList
        threads={[thread]}
        selectedThreadId={null}
        onSelect={onSelect}
        isLoading={false}
      />
    );

    expect(screen.getByText("Ada Okonkwo")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ada okonkwo/i }));
    expect(onSelect).toHaveBeenCalledWith(thread._id);
  });

  it("shows an empty state that points managers at Settings", () => {
    render(
      <InboxThreadList
        threads={[]}
        selectedThreadId={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText(/connect whatsapp or telegram/i)).toBeInTheDocument();
  });
});
