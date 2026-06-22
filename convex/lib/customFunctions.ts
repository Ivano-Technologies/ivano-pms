import {
  customMutation,
  customQuery
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

import { getCurrentManager } from "./auth";

export type AuthedCtx = {
  manager: Doc<"manager">;
};

const propertyScopeArgs = {
  selectedPropertyId: v.optional(v.id("property"))
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
