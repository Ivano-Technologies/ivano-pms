import {
  customMutation,
  customQuery
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import type { UserIdentity } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc } from "../_generated/dataModel";
import { mutation as rawMutation, query as rawQuery } from "../_generated/server";

import { getCurrentManager } from "./auth";
import { withErrorRef } from "./errorRef";
import { assertInternalJobSecret } from "./secrets";

export type AuthedCtx = {
  manager: Doc<"manager">;
};

export type AuthIdentityCtx = {
  identity: UserIdentity;
  /** IVA-194: stable Convex Auth user id (getAuthUserId), never identity.subject. */
  authUserId: string;
};

export type OptionalAuthIdentityCtx = {
  identity: UserIdentity | null;
  authUserId: string | null;
};

/** The signed-in identity plus the stable Convex Auth user id, or nulls when signed out. */
async function readAuth(ctx: Parameters<typeof getAuthUserId>[0]) {
  const identity = await ctx.auth.getUserIdentity();
  const authUserId = identity ? await getAuthUserId(ctx) : null;
  return { identity, authUserId: authUserId as string | null };
}

/** IVA-189: errors from every custom function are logged and rethrown with a support ref. */
const query = withErrorRef(rawQuery, "query");
const mutation = withErrorRef(rawMutation, "mutation");

const propertyScopeArgs = {
  selectedPropertyId: v.optional(v.id("property"))
};

const internalJobSecretArg = {
  secret: v.string()
};

export const authedQuery = customQuery(query, {
  args: propertyScopeArgs,
  input: async (ctx, args) => {
    const manager = await getCurrentManager(ctx, args.selectedPropertyId);
    return {
      ctx: { ...ctx, manager },
      args
    };
  }
});

export const authedMutation = customMutation(mutation, {
  args: propertyScopeArgs,
  input: async (ctx, args) => {
    const manager = await getCurrentManager(ctx, args.selectedPropertyId);
    return {
      ctx: { ...ctx, manager },
      args
    };
  }
});

/** Signed-in callers (Convex Auth); does not require an existing manager row (onboarding). */
export const signedInMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const { identity, authUserId } = await readAuth(ctx);
    if (!identity || !authUserId) {
      throw new Error("Not authenticated");
    }
    return {
      ctx: { ...ctx, identity, authUserId },
      args
    };
  }
});

/** Signed-in callers; throws when session is missing. */
export const signedInQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const { identity, authUserId } = await readAuth(ctx);
    if (!identity || !authUserId) {
      throw new Error("Not authenticated");
    }
    return {
      ctx: { ...ctx, identity, authUserId },
      args
    };
  }
});

/** Session optional — identity is null when signed out. */
export const optionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const { identity, authUserId } = await readAuth(ctx);
    return {
      ctx: { ...ctx, identity, authUserId },
      args
    };
  }
});

/** Public mutation entry points gated by INTERNAL_JOB_SECRET (webhooks, jobs). */
export const internalJobMutation = customMutation(mutation, {
  args: internalJobSecretArg,
  input: async (ctx, args) => {
    assertInternalJobSecret(args.secret);
    return { ctx, args };
  }
});
