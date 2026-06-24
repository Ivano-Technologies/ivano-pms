import { ConvexError } from "convex/values";

const CONVEX_SERVER_ERROR = /\[CONVEX M\(.+\)\].*Server Error/;

/** User-facing message from a Convex client error (ConvexError data or dev message). */
export function getConvexUserMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }

  if (error instanceof Error && error.message.length > 0) {
    if (!CONVEX_SERVER_ERROR.test(error.message)) {
      return error.message;
    }
  }

  return fallback;
}
