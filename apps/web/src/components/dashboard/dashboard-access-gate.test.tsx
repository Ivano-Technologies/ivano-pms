import { render, screen, waitFor } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() })
}));

import { DashboardAccessGate } from "./dashboard-access-gate";

afterEach(() => vi.restoreAllMocks());

function setup(profile: unknown, link: () => Promise<unknown>) {
  vi.mocked(useQuery).mockReturnValue(profile as never);
  const linkFn = vi.fn(link);
  vi.mocked(useMutation).mockReturnValue(linkFn as never);
  render(
    <DashboardAccessGate>
      <p>dashboard content</p>
    </DashboardAccessGate>
  );
  return linkFn;
}

describe("DashboardAccessGate (IVA-194)", () => {
  it("shows the nothing here yet screen with one Sign out action and a logged ref", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const link = setup(null, async () => null);
    expect(link).toHaveBeenCalledWith({});
    expect(
      await screen.findByRole("heading", { name: "You're signed in, but there's nothing here yet." })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ask your property manager to add you, or contact us to set up your property.")
    ).toBeInTheDocument();
    const ref = screen.getByTestId("error-ref");
    expect(ref).toHaveClass("text-muted-foreground", "text-xs");
    const code = ref.textContent!.replace("Ref: ", "");
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(`ref=${code}`));
    const button = screen.getByRole("button", { name: "Sign out" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await waitFor(() => expect(button).toHaveFocus());
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[—–]|Error|authorized/);
  });

  it("shows the same screen without raw text when linking fails, with the logged ref", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    setup(null, async () => {
      throw new Error("[CONVEX M(managers:upsertManagerFromAuth)] Server Error");
    });
    expect(await screen.findByTestId("no-access-screen")).toBeInTheDocument();
    const code = screen.getByTestId("error-ref").textContent!.replace("Ref: ", "");
    expect(err).toHaveBeenCalledWith(`[error] ref=${code} dashboard/link-manager`, expect.any(Error));
    expect(document.body.textContent).not.toMatch(/CONVEX|Server Error/);
  });

  it("renders the dashboard when the manager row exists", async () => {
    setup({ _id: "m1", role: "owner" }, async () => "m1");
    expect(await screen.findByText("dashboard content")).toBeInTheDocument();
    expect(screen.queryByTestId("no-access-screen")).not.toBeInTheDocument();
  });

  it("shows a loading state, not the no access screen, while the profile is loading", () => {
    setup(undefined, () => new Promise(() => {}));
    expect(screen.getByTestId("dashboard-access-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("no-access-screen")).not.toBeInTheDocument();
  });
});
