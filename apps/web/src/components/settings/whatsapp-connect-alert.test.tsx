import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { WhatsAppConnectAlert } from "./whatsapp-connect-alert";

const propertyId = "property1234567890ab" as Id<"property">;
const startHref = "/api/oauth/whatsapp/start?propertyId=property1234567890ab";

afterEach(() => vi.restoreAllMocks());

describe("WhatsAppConnectAlert (IVA-189)", () => {
  it.each([
    ["whatsapp_not_configured", "WhatsApp isn't set up yet. Ask an admin to set it up.", null],
    ["token_exchange_failed", "We couldn't connect WhatsApp. Try again.", "Try again"],
    ["store_failed", "Your WhatsApp connection has expired. Reconnect to keep sending messages.", "Reconnect"],
    ["something_else", "Something went wrong connecting WhatsApp. Try again.", "Try again"]
  ])("%s shows the friendly message, its action and the logged ref", (code, message, action) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<WhatsAppConnectAlert code={code} serverRef="K7QM2XWA" propertyId={propertyId} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(message);
    expect(screen.getByTestId("error-ref")).toHaveTextContent("Ref: K7QM2XWA");
    expect(screen.getByTestId("error-ref")).toHaveClass("text-muted-foreground");
    if (action) {
      expect(screen.getByRole("link", { name: action })).toHaveAttribute("href", startHref);
      expect(screen.getAllByRole("link")).toHaveLength(1);
    } else {
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
    expect(alert.textContent).not.toMatch(/WHATSAPP_APP|Vercel|authorization|token|_/);
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[error\] ref=K7QM2XWA settings\/whatsapp-connect /),
      expect.objectContaining({ message: `WhatsApp connect failed: ${code}` })
    );
  });

  it("makes a ref when the redirect carried none", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<WhatsAppConnectAlert code="access_denied" propertyId={propertyId} />);
    expect(screen.getByTestId("error-ref").textContent).toMatch(/^Ref: [A-Z0-9]{8}$/);
  });
});
