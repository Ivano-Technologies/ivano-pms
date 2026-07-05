import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));

// Flat unit-test project for the web app. Kept separate from the Storybook
// browser project so it can be referenced directly by the root workspace
// (root cannot consume a config that itself nests `test.projects`, which
// silently drops the jsdom environment and the src/** include scope).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dir, "./src")
    },
    dedupe: ["react", "react-dom"]
  },
  test: {
    name: "web",
    environment: "jsdom",
    setupFiles: ["./src/test.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**"],
    environmentMatchGlobs: [["src/app/api/**/*.test.ts", "node"]],
    env: {
      NODE_ENV: "development"
    }
  }
});
