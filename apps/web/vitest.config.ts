import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

// Web-package workspace: the flat unit project plus the Storybook browser
// project. The root workspace references ./vitest.unit.config.ts directly
// instead of this file, so the unit project's jsdom environment and src/**
// include apply correctly in the aggregate `pnpm test` run.
// See docs/planning/known-issues.md (resolved).
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      "./vitest.unit.config.ts",
      {
        extends: "./vitest.unit.config.ts",
        plugins: [
          // See: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
          storybookTest({
            configDir: path.join(dirname, ".storybook")
          })
        ],
        test: {
          name: "storybook",
          environment: undefined,
          include: ["**/*.stories.@(js|jsx|mjs|ts|tsx)"],
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  }
});
