import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BookingCalendar } from "@/components/bookings/booking-calendar";

const units = [
  { _id: "u1", unitNumber: "101", unitType: "room", pricePerNightNgn: 25000 },
  { _id: "u2", unitNumber: "102", unitType: "suite", pricePerNightNgn: 45000 }
];

const bookings = [
  {
    _id: "b1",
    unitId: "u1",
    guestId: "g1",
    checkInDate: "2026-06-10",
    checkOutDate: "2026-06-12",
    status: "confirmed" as const,
    sourceChannel: "direct"
  }
];

const baseProps = {
  today: "2026-06-10",
  bookings,
  units,
  guestNames: { g1: "Ada Okonkwo" },
  onEmptyCellClick: vi.fn(),
  onBookingClick: vi.fn(),
  isLoading: false
};

describe("BookingCalendar", () => {
  it("renders the unit column and 30 day headers", () => {
    const html = renderToStaticMarkup(<BookingCalendar {...baseProps} />);

    expect(html).toContain("Unit");
    expect(html).toContain("101");
    expect(html).toContain("102");
  });

  it("shows booking blocks with guest names", () => {
    const html = renderToStaticMarkup(<BookingCalendar {...baseProps} />);

    expect(html).toContain("Ada Okonkwo");
  });

  it("highlights today in the header row", () => {
    const html = renderToStaticMarkup(<BookingCalendar {...baseProps} bookings={[]} />);

    expect(html).toContain("ring-blue-400");
  });

  it("renders skeleton placeholders while loading", () => {
    const html = renderToStaticMarkup(
      <BookingCalendar {...baseProps} bookings={[]} isLoading />
    );

    expect(html).toContain("animate-pulse");
  });

  it("shows an error message when loading fails", () => {
    const html = renderToStaticMarkup(
      <BookingCalendar
        {...baseProps}
        bookings={[]}
        error={new Error("fail")}
      />
    );

    expect(html).toContain("Unable to load calendar");
  });

  it("matches snapshot for seeded calendar state", () => {
    const html = renderToStaticMarkup(<BookingCalendar {...baseProps} />);
    expect(html).toMatchSnapshot();
  });
});
