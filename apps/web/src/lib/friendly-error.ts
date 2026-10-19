import { ConvexError } from "convex/values";
import { toast } from "sonner";

/**
 * IVA-189: the only way an error reaches the screen.
 *
 *   toastError(err, "We couldn't save the guest. Please try again.")
 *   const { message, ref } = toFriendlyError(err, "We couldn't send your code. Please try again.")
 *
 * Every friendly error carries an 8 character support ref ("Ref: K7QM2XWA") shown in muted text
 * next to the message and logged with the raw error, here and on the Convex server.
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
  permission: "You don't have permission to do that. Ask an admin for access.",
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

function convexData(err: unknown): Record<string, unknown> | string | null {
  if (!(err instanceof ConvexError)) return null;
  const data: unknown = err.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return null;
}

/**
 * The deliberate user message carried by a ConvexError, if any. A message the server marked
 * `userFacing: false` is a developer message: it is used for classification only, never shown.
 */
export function convexErrorMessage(err: unknown): string | null {
  const data = convexData(err);
  if (typeof data === "string") return data;
  if (data && data.userFacing !== false && typeof data.message === "string") return data.message;
  return null;
}

export const ERROR_REF_LENGTH = 8;
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A fresh 8 character support ref, such as "K7QM2XWA". */
export function generateErrorRef(): string {
  const bytes = new Uint8Array(ERROR_REF_LENGTH);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return out;
}

/** Compact a longer event or request id to the 8 character ref shown to users. */
export function refFromId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const compact = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return compact.length >= ERROR_REF_LENGTH ? compact.slice(0, ERROR_REF_LENGTH) : null;
}

/** The ref the Convex server logged for this error (IVA-189 errorRef wrapper), if any. */
export function serverRefOf(err: unknown): string | null {
  const data = convexData(err);
  if (data && typeof data === "object" && typeof data.ref === "string" && data.ref.trim()) {
    return data.ref.trim();
  }
  return null;
}

/** Convex puts "[Request ID: abc123]" in errors it hides; that id is in the Convex logs too. */
function convexRequestRef(err: unknown): string | null {
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const match = /\[Request ID: ([^\]]+)\]/i.exec(message);
  return match ? refFromId(match[1]) : null;
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

type SentryLike = {
  captureException?: (e: unknown) => unknown;
  lastEventId?: () => string | undefined;
};

/**
 * Log the raw error with its support ref and return the ref.
 * Ref order: the one the server logged, then a Sentry event id, then the Convex request id,
 * then a fresh one. The same ref is shown to the user, so support can match the two.
 */
export function reportError(err: unknown, context?: string, knownRef?: string | null): string {
  let ref = knownRef || serverRefOf(err);
  try {
    const sentry =
      typeof window !== "undefined"
        ? (window as unknown as { Sentry?: SentryLike }).Sentry
        : undefined;
    const eventId = sentry?.captureException?.(err);
    ref = ref || refFromId(eventId) || refFromId(sentry?.lastEventId?.());
  } catch {
    // Reporting must never break the screen.
  }
  ref = ref || convexRequestRef(err) || generateErrorRef();
  try {
    console.error(`[error] ref=${ref}${context ? ` ${context}` : ""}`, err);
  } catch {
    // Ignore.
  }
  return ref;
}

export type FriendlyError = {
  message: string;
  action?: "retry" | "signIn";
  ref: string;
};

/** Log the raw error and return what to show: { message, action?, ref }. */
export function toFriendlyError(err: unknown, fallback?: string, context?: string): FriendlyError {
  const ref = reportError(err, context);
  const message = friendlyMessage(err, fallback);
  const kind = classifyError(err);
  const action =
    kind === "sessionExpired" ? "signIn" : kind === "network" || kind === "generic" ? "retry" : undefined;
  return action ? { message, action, ref } : { message, ref };
}

/** Log the raw error and return text that is safe to show. Prefer toFriendlyError or toastError. */
export function toFriendlyMessage(err: unknown, fallback?: string): string {
  return toFriendlyError(err, fallback).message;
}

/** Show a friendly error toast with its support ref as a small muted line. Returns the ref. */
export function toastError(err: unknown, fallback?: string, context?: string): string {
  const { message, ref } = toFriendlyError(err, fallback, context);
  toast.error(message, {
    description: `Ref: ${ref}`,
    classNames: { description: "!text-muted-foreground text-xs" }
  });
  return ref;
}
