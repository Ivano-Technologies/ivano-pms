import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import type { Role } from "@/lib/roles";
import { hasPermission, parseUserRole } from "@/lib/roles";
import { AuthRoleError } from "@/lib/auth-role-error";

export { AuthRoleError };

/**
 * App Router: require a signed in Convex Auth session.
 * Manager roles (owner/manager/staff) live in Convex, not JWT public metadata.
 */
export async function requireSignedIn(): Promise<void> {
  if (!(await isAuthenticatedNextjs())) {
    throw new AuthRoleError("Unauthorized", 401);
  }
}

/**
 * Legacy role helper kept for API routes that still pass metadata-shaped objects.
 * Prefer manager.role from Convex for authorization.
 */
export async function requirePermissionServer(
  minimumRole: Role,
  metadata?: unknown
): Promise<{ role: Role }> {
  await requireSignedIn();
  const role = parseUserRole(metadata);
  if (!hasPermission(role, minimumRole)) {
    throw new AuthRoleError("Forbidden", 403);
  }
  return { role };
}

/** @deprecated Use {@link requirePermissionServer} */
export const requireRoleServer = requirePermissionServer;
