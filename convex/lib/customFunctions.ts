import {
  customMutation,
  customQuery
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import type { UserIdentity } from "convex/server";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

import { getCurrentManager } from "./auth";
import { assertInternalJobSecret } from "./secrets";

export type AuthedCtx = {
  manager: Doc<"manager">;
};

export type AuthIdentityCtx = {
  identity: UserIdentity;
};

export type OptionalAuthIdentityCtx = {
  identity: UserIdentity | null;
};

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return {
      ctx: { ...ctx, identity },
      args
    };
  }
});

/** Signed-in callers; throws when session is missing. */
export const signedInQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return {
      ctx: { ...ctx, identity },
      args
    };
  }
});

/** Session optional — identity is null when signed out. */
export const optionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      ctx: { ...ctx, identity },
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
