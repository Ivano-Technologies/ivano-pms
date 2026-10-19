import { ConvexError } from "convex/values";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RootError from "@/app/error";
import NotFound from "@/app/not-found";
import DashboardError from "@/app/dashboard/error";

afterEach(() => vi.restoreAllMocks());

describe("error pages (IVA-189)", () => {
  it("error.tsx shows a friendly page with one Try again action and a muted ref, never the raw message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const error = Object.assign(new Error("[Request ID: 9f] Server Error Uncaught Error: secret at x.ts:1:1"), {
      digest: "123"
    });
    render(<RootError error={error} unstable_retry={retry} />);
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("We hit a problem loading this page. Please try again.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go home" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toMatch(/Request ID|secret|x\.ts/);
    const ref = screen.getByTestId("error-ref");
    expect(ref).toHaveClass("text-muted-foreground", "text-xs");
    expect(ref.textContent).toMatch(/^Ref: [A-Z0-9]{8}$/);
    const code = ref.textContent!.slice(5);
    expect(console.error).toHaveBeenCalledWith(`[error] ref=${code} app/error`, error);
  });

  it("uses the ref the Convex server logged", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new ConvexError({ ref: "K7QM2XWA", userFacing: false });
    render(<RootError error={error} unstable_retry={vi.fn()} />);
    expect(screen.getByTestId("error-ref")).toHaveTextContent("Ref: K7QM2XWA");
  });

  it("not-found.tsx shows a friendly 404 with a way home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist or has moved.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
  });

  it("moves focus to Try again when the error screen appears", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <>
        <button type="button">Search pages</button>
        <DashboardError error={new Error("boom")} unstable_retry={vi.fn()} />
      </>
    );
    expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus();
  });

  it("moves focus to Go home on the 404 and shows the 404 numeral in muted grey", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Go home" })).toHaveFocus();
    const numeral = screen.getByTestId("not-found-code");
    expect(numeral).toHaveTextContent("404");
    expect(numeral).toHaveClass("text-muted-foreground");
    expect(numeral).not.toHaveClass("text-primary");
  });
});
