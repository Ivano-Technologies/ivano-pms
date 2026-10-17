import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RootError from "@/app/error";
import NotFound from "@/app/not-found";

afterEach(() => vi.restoreAllMocks());

describe("error pages (IVA-189)", () => {
  it("error.tsx shows a friendly page with Try again and Go home, never the raw message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const error = Object.assign(new Error("[Request ID: 9f] Server Error Uncaught Error: secret at x.ts:1:1"), {
      digest: "123"
    });
    render(<RootError error={error} unstable_retry={retry} />);
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("We hit a problem loading this page. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toMatch(/Request ID|secret|x\.ts|123/);
    expect(console.error).toHaveBeenCalled();
  });

  it("not-found.tsx shows a friendly 404 with a way home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist or has moved.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
