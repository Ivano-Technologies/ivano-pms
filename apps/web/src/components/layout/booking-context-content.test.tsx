import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mockBooking = {
  _id: "booking_1",
  guestId: "guest_1",
  unitId: "unit_1",
  checkInDate: "2026-07-01",
  checkOutDate: "2026-07-05",
  status: "confirmed",
  sourceChannel: "telegram",
  totalPriceNgn: 120000,
  guestName: "Ada Okafor",
  guestPhone: "+2348012345678",
  guestEmail: "ada@example.com",
  unitNumber: "A1",
  unitType: "studio"
};

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockBooking),
  useMutation: vi.fn(() => vi.fn())
}));

import { BookingContextContent } from "./booking-context-content";

describe("BookingContextContent", () => {
  it("shows guest name, dates, and checklist action", () => {
    const onOpenChecklist = vi.fn();
    render(
      <BookingContextContent
        bookingId={"booking_1" as never}
        onOpenChecklist={onOpenChecklist}
      />
    );

    expect(screen.getByText("Ada Okafor")).toBeInTheDocument();
    expect(screen.getByText(/2026-07-01/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open checklist/i }));
    expect(onOpenChecklist).toHaveBeenCalledTimes(1);
  });
});
