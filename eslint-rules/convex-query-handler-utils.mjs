/**
 * Shared helpers: detect when a node sits inside a Convex `query` / `internalQuery` `handler` function.
 * Ancestor order: root → … → parent of the leaf node (ESLint `getAncestors`).
 */

/**
 * @param {import('estree').Node} node
 */
export function isHandlerFunction(node) {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression" ||
    node.type === "FunctionDeclaration"
  );
}

/**
 * @param {import('estree').Node[]} ancestors From root to parent of some descendant
 * @param {number} i index of a function node in `ancestors`
 */
export function isConvexQueryHandler(ancestors, i) {
  const parent = ancestors[i - 1];
  if (!parent || parent.type !== "Property" || parent.computed) {
    return false;
  }
  const key = parent.key;
  if (key.type !== "Identifier" || key.name !== "handler") {
    return false;
  }
  const objExpr = ancestors[i - 2];
  const callExpr = ancestors[i - 3];
  if (!objExpr || objExpr.type !== "ObjectExpression") {
    return false;
  }
  if (!callExpr || callExpr.type !== "CallExpression") {
    return false;
  }
  const callee = callExpr.callee;
  if (callee.type !== "Identifier") {
    return false;
  }
  return callee.name === "query" || callee.name === "internalQuery";
}

/**
 * True if `leaf` is lexically inside a Convex public/internal query `handler`.
 *
 * @param {import('estree').Node} leaf
 * @param {import('eslint').SourceCode} sourceCode
 */
export function isInsideConvexQueryHandler(leaf, sourceCode) {
  const ancestors = sourceCode.getAncestors(leaf);
  for (let i = 0; i < ancestors.length; i++) {
    const n = ancestors[i];
    if (!isHandlerFunction(n)) {
      continue;
    }
    if (isConvexQueryHandler(ancestors, i)) {
      return true;
    }
  }
  return false;
}
