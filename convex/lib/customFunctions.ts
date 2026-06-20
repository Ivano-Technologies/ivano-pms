import {
  customMutation,
  customQuery
} from "convex-helpers/server/customFunctions";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

import { getCurrentManager } from "./auth";

export type AuthedCtx = {
  manager: Doc<"manager">;
};

export const authedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const manager = await getCurrentManager(ctx);
    return {
      ctx: { ...ctx, manager },
      args
    };
  }
});

export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const manager = await getCurrentManager(ctx);
    return {
      ctx: { ...ctx, manager },
      args
    };
  }
});
