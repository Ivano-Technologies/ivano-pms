import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/dynamic", () => ({
  default: () => {
    function MockBookingChecklist() {
      return <div data-testid="booking-checklist" />;
    }
    return MockBookingChecklist;
  }
}));

import { ChecklistSlideOver } from "./checklist-slide-over";

describe("ChecklistSlideOver", () => {
  it("renders checklist when open and closes on dismiss", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ChecklistSlideOver
        bookingId={"booking_1" as never}
        guestName="Ada Okafor"
        open={false}
        onClose={onClose}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <ChecklistSlideOver
        bookingId={"booking_1" as never}
        guestName="Ada Okafor"
        open
        onClose={onClose}
      />
    );

    expect(screen.getByRole("dialog", { name: /checklist/i })).toBeInTheDocument();
    expect(screen.getByTestId("booking-checklist")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close checklist" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
