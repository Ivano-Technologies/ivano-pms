import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentManager(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"manager">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const manager = await ctx.db
    .query("manager")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!manager || manager.isDeleted) {
    throw new Error("Not authorized: manager account not found");
  }

  return manager;
}

export function assertPropertyAccess(
  manager: Doc<"manager">,
  propertyId: Doc<"manager">["propertyId"]
): void {
  if (manager.propertyId !== propertyId) {
    throw new Error("Not authorized for this property");
  }
}
