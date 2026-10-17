import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const signIn = vi.fn();

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn, signOut: vi.fn() })
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() })
}));

import { AuthCard } from "./auth-card";

afterEach(() => {
  vi.restoreAllMocks();
  signIn.mockReset();
});

async function submitEmail() {
  render(<AuthCard mode="signIn" />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "ada@hotel.ng" } });
  fireEvent.click(screen.getByRole("button", { name: /Continue$/ }));
}

describe("AuthCard friendly errors (IVA-189)", () => {
  it("shows a plain message instead of the Convex server error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signIn.mockRejectedValueOnce(
      new Error("[CONVEX A(auth:signIn)] [Request ID: 5e1] Server Error Uncaught Error: Resend 500")
    );
    await submitEmail();
    expect(await screen.findByText("We couldn't send your code. Please try again.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Request ID|CONVEX|Resend 500/);
  });

  it("shows the network line when offline", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signIn.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await submitEmail();
    expect(
      await screen.findByText("We couldn't reach the server. Check your connection and try again.")
    ).toBeInTheDocument();
  });

  it("shows the exact wrong code line with a muted ref that matches the log", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    signIn.mockResolvedValueOnce(undefined);
    await submitEmail();
    fireEvent.change(await screen.findByLabelText(/code/i), { target: { value: "123456" } });
    signIn.mockRejectedValueOnce(new Error("[CONVEX A(auth:signIn)] [Request ID: 5e1] Server Error Uncaught Error: Could not verify code"));
    fireEvent.click(screen.getByRole("button", { name: /verify|sign in|continue/i }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("That code didn't work. Check it and try again, or request a new one.");
    const ref = screen.getByTestId("error-ref");
    expect(ref).toHaveClass("text-muted-foreground");
    const code = ref.textContent!.replace("Ref: ", "");
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(spy).toHaveBeenCalledWith(`[error] ref=${code} auth`, expect.any(Error));
  });

  it("shows no ref for a local message", async () => {
    render(<AuthCard mode="signIn" />);
    fireEvent.click(screen.getByRole("button", { name: /Continue$/ }));
    expect(await screen.findByText("Enter your email address")).toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
  });
});
