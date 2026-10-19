import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";

const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastErrorSpy(...args) } }));

import {
  FRIENDLY_MESSAGES,
  UserFacingError,
  friendlyMessage,
  generateErrorRef,
  looksLikeRawServerText,
  refFromId,
  reportError,
  serverRefOf,
  toFriendlyError,
  toFriendlyMessage,
  toastError
} from "./friendly-error";

afterEach(() => vi.restoreAllMocks());

const convexProd = (inner = "") =>
  new Error(`[CONVEX M(functions/guests:create)] [Request ID: 7d1c2a9b] Server Error${inner}`);

describe("friendlyMessage (IVA-189)", () => {
  it("passes through ConvexError text written for the user", () => {
    expect(friendlyMessage(new ConvexError("Unit already booked for these dates"))).toBe(
      "Unit already booked for these dates"
    );
    expect(friendlyMessage(new ConvexError({ message: "Guest already checked in" }))).toBe(
      "Guest already checked in"
    );
    expect(friendlyMessage(new UserFacingError("Pick a unit first."))).toBe("Pick a unit first.");
  });

  it("hides the Convex request id and server error wrapper", () => {
    expect(friendlyMessage(convexProd())).toBe("Something went wrong. Please try again.");
    expect(friendlyMessage(convexProd(), "We couldn't save the guest. Please try again.")).toBe(
      "We couldn't save the guest. Please try again."
    );
  });

  it("maps an expired session", () => {
    expect(friendlyMessage(convexProd(" Uncaught Error: Not authenticated at handler (x.ts:3:9)"))).toBe(
      "Your session has expired. Please sign in again."
    );
    expect(friendlyMessage({ status: 401, message: "x" })).toBe(FRIENDLY_MESSAGES.sessionExpired);
  });

  it("maps permission denied", () => {
    expect(friendlyMessage(convexProd(" Uncaught Error: Not authorized for this property"))).toBe(
      "You don't have permission to do that. Ask an admin for access."
    );
    expect(friendlyMessage({ status: 403, message: "x" })).toBe(FRIENDLY_MESSAGES.permission);
  });

  it("maps not found, duplicates and records still in use", () => {
    expect(friendlyMessage(convexProd(" Uncaught Error: Guest not found"))).toBe(FRIENDLY_MESSAGES.notFound);
    expect(friendlyMessage({ status: 409, message: "x" })).toBe("That already exists.");
    expect(friendlyMessage(new Error("Unit is still in use by bookings"))).toBe(
      "This is still in use by other records."
    );
  });

  it("maps validation errors", () => {
    expect(
      friendlyMessage(convexProd(" ArgumentValidationError: Value does not match validator."))
    ).toBe(FRIENDLY_MESSAGES.validation);
  });

  it("maps network, offline and rate limits", () => {
    expect(friendlyMessage(new TypeError("Failed to fetch"))).toBe(
      "We couldn't reach the server. Check your connection and try again."
    );
    expect(friendlyMessage(new Error("Connection lost while action was in flight"))).toBe(
      FRIENDLY_MESSAGES.network
    );
    expect(friendlyMessage({ status: 429, message: "Too Many Requests" })).toBe(FRIENDLY_MESSAGES.rateLimit);
  });

  it("maps a wrong sign in code", () => {
    expect(friendlyMessage(new Error("Could not verify code"))).toBe(FRIENDLY_MESSAGES.invalidLogin);
    expect(friendlyMessage(new Error("InvalidAccountId"))).toBe(FRIENDLY_MESSAGES.invalidLogin);
  });

  it("falls back to the generic line for anything unknown", () => {
    expect(friendlyMessage(new Error("TypeError: Cannot read properties of undefined (reading '_id')"))).toBe(
      FRIENDLY_MESSAGES.generic
    );
    expect(friendlyMessage(undefined)).toBe(FRIENDLY_MESSAGES.generic);
    expect(friendlyMessage(new ConvexError("[Request ID: abc] Server Error"))).toBe(FRIENDLY_MESSAGES.generic);
  });

  it("logs the raw error with console.error and its ref", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    toFriendlyMessage(err);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^\[error\] ref=[A-Z2-9]{8}$/), err);
  });

  it("never shows a server message marked userFacing false, but still classifies it", () => {
    const err = new ConvexError({ message: "Guest not found", ref: "K7QM2XWA", userFacing: false });
    expect(friendlyMessage(err)).toBe(FRIENDLY_MESSAGES.notFound);
    const internal = new ConvexError({ message: "Ledger mismatch on row", ref: "K7QM2XWA", userFacing: false });
    expect(friendlyMessage(internal, "We couldn't save the guest. Please try again.")).toBe(
      "We couldn't save the guest. Please try again."
    );
    expect(friendlyMessage(new ConvexError({ message: "Unit already booked for these dates", ref: "K7QM2XWA", userFacing: true }))).toBe(
      "Unit already booked for these dates"
    );
  });

  it("detects raw server text", () => {
    expect(looksLikeRawServerText("[Request ID: 1] Server Error")).toBe(true);
    expect(looksLikeRawServerText("token_exchange_failed")).toBe(true);
    expect(looksLikeRawServerText("Unit already booked for these dates")).toBe(false);
  });

  it("keeps every friendly line free of dashes used as punctuation", () => {
    for (const line of Object.values(FRIENDLY_MESSAGES)) {
      expect(line).not.toMatch(/[\u2013\u2014]| - /);
    }
  });
});

describe("support refs (IVA-189)", () => {
  it("generates 8 character refs from an unambiguous alphabet", () => {
    for (let i = 0; i < 20; i++) expect(generateErrorRef()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);
  });

  it("reuses the ref the Convex server logged", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new ConvexError({ message: "Unit already booked for these dates", ref: "K7QM2XWA", userFacing: true });
    expect(serverRefOf(err)).toBe("K7QM2XWA");
    expect(toFriendlyError(err)).toEqual({ message: "Unit already booked for these dates", ref: "K7QM2XWA" });
    expect(console.error).toHaveBeenCalledWith("[error] ref=K7QM2XWA", err);
  });

  it("uses the Convex request id when the server sent no ref", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(reportError(convexProd())).toBe("7D1C2A9B");
  });

  it("uses a Sentry event id when Sentry is present", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    (window as unknown as { Sentry?: unknown }).Sentry = { captureException: () => "9f3c2a1b4d5e6f70" };
    try {
      expect(reportError(new Error("boom"))).toBe("9F3C2A1B");
    } finally {
      delete (window as unknown as { Sentry?: unknown }).Sentry;
    }
    expect(refFromId("abc")).toBeNull();
  });

  it("returns { message, action, ref }", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const net = toFriendlyError(new TypeError("Failed to fetch"));
    expect(net).toMatchObject({ message: FRIENDLY_MESSAGES.network, action: "retry" });
    expect(net.ref).toMatch(/^[A-Z2-9]{8}$/);
    expect(toFriendlyError(new Error("Not authenticated")).action).toBe("signIn");
    expect(toFriendlyError(new ConvexError("That already exists.")).action).toBeUndefined();
  });

  it("toastError shows the friendly line with a muted Ref description", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    toastErrorSpy.mockClear();
    const ref = toastError(new ConvexError({ ref: "K7QM2XWA", userFacing: false }), "We couldn't save the unit. Please try again.");
    expect(ref).toBe("K7QM2XWA");
    expect(toastErrorSpy).toHaveBeenCalledWith("We couldn't save the unit. Please try again.", {
      description: "Ref: K7QM2XWA",
      classNames: { description: expect.stringContaining("text-muted-foreground") }
    });
  });

  it("keeps the sign in code line exact", () => {
    expect(FRIENDLY_MESSAGES.invalidLogin).toBe("That code didn't work. Check it and try again, or request a new one.");
    for (const line of Object.values(FRIENDLY_MESSAGES)) expect(line).not.toMatch(/[\u2010-\u2015-]/);
  });
});
