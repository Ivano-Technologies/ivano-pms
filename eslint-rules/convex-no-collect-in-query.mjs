/**
 * Flags `.collect()` on Convex query builders inside `query` / `internalQuery` handlers.
 * Prefer `.take(n)` for bounded reads or `.paginate()` for large sets.
 */

import { isInsideConvexQueryHandler } from "./convex-query-handler-utils.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Avoid unbounded .collect() in Convex queries; use .take(limit), .paginate(), or move full scans to actions/mutations where appropriate.",
      recommended: false
    },
    messages: {
      noCollectInQuery:
        "Avoid .collect() in Convex queries — it loads an unbounded result set and can hurt performance at scale. Prefer .take(50) (or another cap), .paginate({ numItems, cursor }), or redesign with indexes; use eslint-disable-next-line only with a documented reason."
    },
    schema: []
  },

  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * @param {import('estree').CallExpression} node
     */
    function isCollectCall(node) {
      const c = node.callee;
      return (
        c.type === "MemberExpression" &&
        c.property.type === "Identifier" &&
        c.property.name === "collect" &&
        !c.computed
      );
    }

    return {
      CallExpression(node) {
        if (!isCollectCall(node)) {
          return;
        }
        if (!isInsideConvexQueryHandler(node, sourceCode)) {
          return;
        }
        context.report({ node, messageId: "noCollectInQuery" });
      }
    };
  }
};
