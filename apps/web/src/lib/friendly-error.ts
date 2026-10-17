import { ConvexError } from "convex/values";

/**
 * IVA-189: the only way an error reaches the screen.
 *
 *   toast.error(toFriendlyMessage(err, "We couldn't save the guest. Please try again."))
 *
 * - Messages the app deliberately wrote for the user pass through: a `ConvexError` whose data is a
 *   string (or `{ message }`), or a `UserFacingError` thrown in the web app.
 * - Known cases (session expired, permission, not found, duplicate, in use, validation, network,
 *   rate limit, invalid code) map to plain English.
 * - Everything else, including Convex "[Request ID: ...] Server Error" text, HTTP status text and
 *   stack traces, becomes the caller's fallback or "Something went wrong. Please try again."
 * The raw error is always logged with console.error, and sent to Sentry when it is present.
 */

export const FRIENDLY_MESSAGES = {
  invalidLogin: "That code didn't work. Check it and try again, or request a new one.",
  sessionExpired: "Your session has expired. Please sign in again.",
  permission: "You don't have permission to do that.",
  notFound: "We couldn't find that. It may have been moved or deleted.",
  duplicate: "That already exists.",
  inUse: "This is still in use by other records.",
  validation: "Some details aren't valid. Please check them and try again.",
  network: "We couldn't reach the server. Check your connection and try again.",
  rateLimit: "Too many attempts. Please wait a moment and try again.",
  generic: "Something went wrong. Please try again."
} as const;

export type FriendlyErrorKind = keyof typeof FRIENDLY_MESSAGES;

/** A message written for the user. Shown as is. */
export class UserFacingError extends Error {
  readonly userFacing = true as const;
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

const RAW_PATTERNS: RegExp[] = [
  /\[CONVEX [A-Z]\(/,
  /\[Request ID: [^\]]*\]/i,
  /\bServer Error\b/i,
  /\bUncaught\b/,
  /\bArgumentValidationError\b/,
  /\bValidator error\b/i,
  /\b(ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN)\b/,
  /\b(TypeError|ReferenceError|SyntaxError|RangeError):/,
  /\bCannot read propert(y|ies) of\b/i,
  /\bis not a function\b/i,
  /\bUnexpected token\b/i,
  /\bin JSON at position\b/i,
  /^\s*at .+:\d+:\d+\)?\s*$/m,
  /<!DOCTYPE|<html/i,
  /^\s*[[{]/,
  /^\s*\d{3}\s*(:|\b[A-Z])/,
  /\b(Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout)\b/i,
  /\bId<"|\bv\.id\(|Document with ID\b/,
  /^[a-z]+(_[a-z]+)+$/
];

export function looksLikeRawServerText(message: string): boolean {
  const text = message.trim();
  if (!text) return true;
  if (text.length > 300) return true;
  return RAW_PATTERNS.some((re) => re.test(text));
}

/** The deliberate user message carried by a ConvexError, if any. */
export function convexErrorMessage(err: unknown): string | null {
  if (!(err instanceof ConvexError)) return null;
  const data: unknown = err.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return null;
}

function collect(err: unknown) {
  const codes: string[] = [];
  const statuses: number[] = [];
  const messages: string[] = [];
  const seen = new Set<unknown>();
  const visit = (e: unknown, depth: number) => {
    if (e == null || depth > 4 || seen.has(e)) return;
    if (typeof e === "string") {
      messages.push(e);
      return;
    }
    if (typeof e !== "object") return;
    seen.add(e);
    const rec = e as Record<string, unknown>;
    if (typeof rec.code === "string") codes.push(rec.code);
    for (const key of ["status", "statusCode"]) {
      if (typeof rec[key] === "number") statuses.push(rec[key] as number);
    }
    for (const key of ["message", "error", "description"]) {
      if (typeof rec[key] === "string") messages.push(rec[key] as string);
    }
    visit(rec.cause, depth + 1);
    visit(rec.data, depth + 1);
  };
  visit(err, 0);
  return { codes, statuses, messages };
}

export function classifyError(err: unknown): FriendlyErrorKind {
  const { codes, statuses, messages } = collect(err);
  const text = messages.join(" \n ");
  const has = (re: RegExp) => re.test(text);
  const code = (...values: string[]) => codes.some((c) => values.includes(c));
  const status = (...values: number[]) => statuses.some((s) => values.includes(s));

  if (
    has(/Failed to fetch|NetworkError|Network request failed|Load failed|fetch failed|WebSocket|Connection lost|\boffline\b/i) ||
    code("ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN")
  ) {
    return "network";
  }
  if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) return "network";
  if (status(429) || has(/rate limit|too many requests|too many attempts/i)) return "rateLimit";
  if (has(/InvalidAccountId|InvalidSecret|invalid (verification )?code|could not verify code|code (has )?expired|invalid credentials/i)) {
    return "invalidLogin";
  }
  if (status(401) || has(/not authenticated|unauthenticated|session (has )?expired|sign in again|auth session missing/i)) {
    return "sessionExpired";
  }
  if (status(403) || has(/not authori[sz]ed|unauthori[sz]ed|forbidden|permission denied|do not have permission/i)) {
    return "permission";
  }
  if (status(409) || has(/already exists|duplicate|already booked/i)) return "duplicate";
  if (has(/still in use|still referenced|has (existing )?bookings/i)) return "inUse";
  if (status(404) || has(/\bnot found\b/i)) return "notFound";
  if (status(400, 422) || has(/ArgumentValidationError|Validator error|invalid (input|payload|value)/i)) {
    return "validation";
  }
  if (status(408, 504) || has(/timed? ?out/i)) return "network";
  return "generic";
}

/** Pure mapping, no logging. */
export function friendlyMessage(err: unknown, fallback?: string): string {
  const convexMessage = convexErrorMessage(err);
  if (convexMessage && !looksLikeRawServerText(convexMessage)) return convexMessage;
  if (err instanceof UserFacingError && !looksLikeRawServerText(err.message)) return err.message;
  const kind = classifyError(err);
  if (kind !== "generic") return FRIENDLY_MESSAGES[kind];
  return fallback && fallback.trim() ? fallback : FRIENDLY_MESSAGES.generic;
}

export function reportError(err: unknown, context?: string): void {
  try {
    console.error(context ? `[error] ${context}` : "[error]", err);
    const sentry =
      typeof window !== "undefined"
        ? (window as unknown as { Sentry?: { captureException?: (e: unknown) => void } }).Sentry
        : undefined;
    sentry?.captureException?.(err);
  } catch {
    // Reporting must never break the screen.
  }
}

/** Log the raw error and return text that is safe to show. */
export function toFriendlyMessage(err: unknown, fallback?: string): string {
  reportError(err);
  return friendlyMessage(err, fallback);
}
