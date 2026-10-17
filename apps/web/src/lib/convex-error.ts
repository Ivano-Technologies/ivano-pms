import { toFriendlyMessage } from "@/lib/friendly-error";

/**
 * @deprecated Use `toFriendlyMessage` from `@/lib/friendly-error` (IVA-189). Kept as a thin alias
 * so older imports still get the friendly behaviour.
 */
export function getConvexUserMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  return toFriendlyMessage(error, fallback);
}
