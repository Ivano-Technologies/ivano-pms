import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getManagerForProperty(
  ctx: QueryCtx | MutationCtx,
  authUserId: string,
  propertyId: Id<"property">
): Promise<Doc<"manager">> {
  const managers = await ctx.db
    .query("manager")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
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
  // IVA-194: the stable Convex Auth user id. identity.subject is "userId|sessionId" and changes
  // on every sign in, so it must never be used as the manager's authUserId.
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) {
    throw new Error("Not authenticated");
  }

  if (selectedPropertyId) {
    return await getManagerForProperty(ctx, authUserId, selectedPropertyId);
  }

  const managers = await ctx.db
    .query("manager")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
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
