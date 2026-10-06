/**
 * Forbid raw query/mutation imports from _generated/server in convex/functions/.
 * Use authedQuery/authedMutation (or signedIn and internalJob wrappers) from customFunctions.ts,
 * or internalQuery/internalMutation/action for backend-only entry points.
 */

/** @param {string} source */
function isGeneratedServerImport(source) {
  return (
    typeof source === "string" &&
    (source === "../_generated/server" ||
      source.endsWith("/_generated/server") ||
      source === "./_generated/server")
  );
}

/** @param {string} filename */
function isConvexFunctionsFile(filename) {
  const normalized = filename.replaceAll("\\", "/");
  return (
    normalized.includes("/convex/functions/") &&
    !normalized.includes("/convex/lib/")
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing query or mutation from _generated/server in convex/functions. Use authedQuery/authedMutation from convex/lib/customFunctions.ts, or internalQuery/internalMutation/action for backend-only handlers.",
      recommended: false
    },
    messages: {
      noRawQueryMutation:
        "Do not import `{{name}}` from `_generated/server` in convex/functions. Use `authedQuery` / `authedMutation` from `convex/lib/customFunctions.ts` (or `internalQuery` / `internalMutation` / `action` for backend-only entry points)."
    },
    schema: []
  },

  create(context) {
    if (!isConvexFunctionsFile(context.filename)) {
      return {};
    }

    return {
      /** @param {import('estree').ImportDeclaration} node */
      ImportDeclaration(node) {
        if (!isGeneratedServerImport(node.source.value)) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") {
            continue;
          }
          if (
            specifier.imported.type === "Identifier" &&
            (specifier.imported.name === "query" ||
              specifier.imported.name === "mutation")
          ) {
            context.report({
              node: specifier,
              messageId: "noRawQueryMutation",
              data: { name: specifier.imported.name }
            });
          }
        }
      }
    };
  }
};
