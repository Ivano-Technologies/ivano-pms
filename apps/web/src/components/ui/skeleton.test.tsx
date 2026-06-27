import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton, SkeletonCard, SkeletonText } from "./skeleton";

describe("Skeleton primitives", () => {
  it("marks skeleton region as busy for loading states", () => {
    render(<Skeleton className="h-4 w-24" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("renders predictable text-line placeholders", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('[data-slot="skeleton"]');
    expect(lines).toHaveLength(3);
  });

  it("renders card-shaped skeleton matching inbox row layout", () => {
    render(<SkeletonCard />);
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
  });
});
