import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/dashboard/guests"
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => [
    { _id: "prop_a", name: "Gwarimpa Estate" },
    { _id: "prop_b", name: "Lekki Flat" }
  ]),
  useMutation: vi.fn(() => vi.fn())
}));

import { PropertyProvider } from "./property-context";
import { CommandBar } from "./command-bar";

function renderBar() {
  return render(
    <PropertyProvider>
      <CommandBar onOpenPalette={() => {}} />
    </PropertyProvider>
  );
}

describe("CommandBar", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("shows the property switcher with plain-language property names", () => {
    renderBar();
    expect(screen.getByLabelText(/select property/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gwarimpa Estate" })).toBeInTheDocument();
  });

  it("exposes a search control that opens the command palette", () => {
    const onOpenPalette = vi.fn();
    render(
      <PropertyProvider>
        <CommandBar onOpenPalette={onOpenPalette} />
      </PropertyProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /open command palette/i }));
    expect(onOpenPalette).toHaveBeenCalledTimes(1);
  });
});
