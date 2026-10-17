import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FRIENDLY_MESSAGES,
  UserFacingError,
  friendlyMessage,
  looksLikeRawServerText,
  toFriendlyMessage
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
      "You don't have permission to do that."
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

  it("logs the raw error with console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = convexProd();
    toFriendlyMessage(err);
    expect(spy).toHaveBeenCalledWith("[error]", err);
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
