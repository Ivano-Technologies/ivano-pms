import convexPlugin from "@convex-dev/eslint-plugin";
import tseslint from "typescript-eslint";
import { rule as noCollectInQuery } from "./eslint-rules/convex-no-collect-in-query.mjs";
import { rule as noDateNowInQuery } from "./eslint-rules/convex-no-date-now-in-query.mjs";
import { rule as noRawQueryMutation } from "./eslint-rules/convex-no-raw-query-mutation.mjs";

export default tseslint.config(
  {
    ignores: ["convex/_generated/**"]
  },
  {
    files: ["convex/**/*.ts"],
    extends: [
      ...tseslint.configs.recommended,
      ...convexPlugin.configs.recommended
    ],
    plugins: {
      local: {
        rules: {
          "no-collect-in-query": noCollectInQuery,
          "no-date-now-in-query": noDateNowInQuery,
          "no-raw-query-mutation": noRawQueryMutation
        }
      }
    },
    rules: {
      // Use local/no-collect-in-query for actionable messaging; keep official rule off to avoid duplicate reports.
      "@convex-dev/no-collect-in-query": "off",
      "local/no-collect-in-query": "error",
      "local/no-date-now-in-query": "error",
      "local/no-raw-query-mutation": "error"
    }
  }
);
