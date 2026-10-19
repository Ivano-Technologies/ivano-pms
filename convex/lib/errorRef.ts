import { ConvexError, type Value } from "convex/values";

/**
 * IVA-189: support reference codes for Convex errors.
 *
 * Every error thrown by an app query or mutation is logged once on the server with an 8 character
 * ref (visible in the Convex function logs) and rethrown as a ConvexError whose data carries the
 * same ref. The web app shows "Ref: XXXXXXXX" next to the friendly message, so support can match
 * what the user saw with the log line.
 *
 * data shape: { message?: string, ref: string, userFacing: boolean }
 * - userFacing true: the message was written for the user (a ConvexError) and may be shown.
 * - userFacing false: a developer message. Sent only when it looks safe, and only so the client can
 *   classify it (session expired, not found, and so on). The client never shows it as is.
 */

export const ERROR_REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ERROR_REF_LENGTH = 8;

export function generateErrorRef(): string {
  const bytes = new Uint8Array(ERROR_REF_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += ERROR_REF_ALPHABET[bytes[i] % ERROR_REF_ALPHABET.length];
  }
  return out;
}

export type ErrorRefData = {
  message?: string;
  ref: string;
  userFacing: boolean;
  [key: string]: Value | undefined;
};

/** Short, single line text with no ids, paths or stack frames. */
function isSafeToForward(message: string): boolean {
  const text = message.trim();
  if (!text || text.length > 200 || /[\r\n]/.test(text)) return false;
  if (/\[|\{|<|\bat .+:\d+|\b[a-z0-9]{25,}\b|https?:\/\//i.test(text))
    return false;
  return true;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

/** Convert any thrown value into a ConvexError carrying a ref. Does not log. */
export function toRefError(
  err: unknown,
  ref: string,
): ConvexError<ErrorRefData> {
  if (err instanceof ConvexError) {
    const data: unknown = err.data;
    if (
      data &&
      typeof data === "object" &&
      typeof (data as { ref?: unknown }).ref === "string"
    ) {
      return err as ConvexError<ErrorRefData>;
    }
    if (typeof data === "string")
      return new ConvexError({ message: data, ref, userFacing: true });
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const rec = data as Record<string, Value>;
      return new ConvexError({
        ...rec,
        ref,
        userFacing: typeof rec.userFacing === "boolean" ? rec.userFacing : true,
      });
    }
    return new ConvexError({ ref, userFacing: false });
  }
  const message = errorMessage(err);
  return new ConvexError(
    isSafeToForward(message)
      ? { message, ref, userFacing: false }
      : { ref, userFacing: false },
  );
}

/** Log the raw error with its ref, then return the ConvexError to throw. */
export function logAndWrapError(
  err: unknown,
  kind: string,
): ConvexError<ErrorRefData> {
  const existing =
    err instanceof ConvexError && err.data && typeof err.data === "object"
      ? (err.data as { ref?: unknown }).ref
      : undefined;
  if (typeof existing === "string") return err as ConvexError<ErrorRefData>;
  const ref = generateErrorRef();
  const wrapped = toRefError(err, ref);
  const userFacing = wrapped.data.userFacing;
  const line = JSON.stringify({
    type: "convex_error",
    ref,
    kind,
    userFacing,
    message: errorMessage(err),
  });
  if (userFacing) {
    console.warn(line);
  } else {
    console.error(line);
    console.error(`[convex_error] ref=${ref}`, err);
  }
  return wrapped;
}

type AnyHandler = (ctx: unknown, args: unknown) => unknown;

/**
 * Wrap a Convex function builder (query, mutation) so every handler it registers logs and rethrows
 * errors with a ref. Used as the base for the custom builders in customFunctions.ts.
 */
export function withErrorRef<B>(builder: B, kind: string): B {
  const wrap =
    (handler: AnyHandler): AnyHandler =>
    async (ctx, args) => {
      try {
        return await handler(ctx, args);
      } catch (err) {
        throw logAndWrapError(err, kind);
      }
    };
  const wrapped = (def: AnyHandler | { handler: AnyHandler }) =>
    (builder as unknown as (d: unknown) => unknown)(
      typeof def === "function"
        ? { handler: wrap(def) }
        : { ...def, handler: wrap(def.handler) },
    );
  return wrapped as unknown as B;
}
