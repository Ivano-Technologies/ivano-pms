/**
 * Flags Date.now() inside Convex query / internalQuery handler functions.
 * Lexical only: does not follow calls into helpers in other files.
 */

import { isInsideConvexQueryHandler } from "./convex-query-handler-utils.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Date.now() inside Convex query handlers. Queries must be deterministic; pass current time as an argument (e.g. args.now with v.number()) instead of reading the clock in the handler.",
      recommended: false
    },
    messages: {
      noDateNowInQuery:
        "Avoid Date.now() inside Convex query. Pass current time as a parameter to the query instead (e.g. args.now with v.number()), then use `const now = args.now` in the handler."
    },
    schema: []
  },

  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * @param {import('estree').CallExpression} node
     */
    function isDateNowCall(node) {
      const c = node.callee;
      return (
        c.type === "MemberExpression" &&
        c.object.type === "Identifier" &&
        c.object.name === "Date" &&
        c.property.type === "Identifier" &&
        c.property.name === "now" &&
        !c.computed
      );
    }

    return {
      CallExpression(node) {
        if (!isDateNowCall(node)) {
          return;
        }
        if (!isInsideConvexQueryHandler(node, sourceCode)) {
          return;
        }
        context.report({ node, messageId: "noDateNowInQuery" });
      }
    };
  }
};
