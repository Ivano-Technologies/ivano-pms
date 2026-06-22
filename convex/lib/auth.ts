import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getManagerForProperty(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
  propertyId: Id<"property">
): Promise<Doc<"manager">> {
  const managers = await ctx.db
    .query("manager")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .take(10);

  const manager = managers.find(
    (m) => !m.isDeleted && m.propertyId === propertyId
  );

  if (!manager) {
    throw new Error("Not authorized for this property");
  }

  return manager;
}

export async function getCurrentManager(
  ctx: QueryCtx | MutationCtx,
  selectedPropertyId?: Id<"property">
): Promise<Doc<"manager">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  if (selectedPropertyId) {
    return await getManagerForProperty(
      ctx,
      identity.subject,
      selectedPropertyId
    );
  }

  const managers = await ctx.db
    .query("manager")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .take(10);

  const manager = managers.find((m) => !m.isDeleted);

  if (!manager) {
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
