import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dir, "./src")
    },
    dedupe: ["react", "react-dom"]
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    environmentMatchGlobs: [["src/app/api/**/*.test.ts", "node"]],
    env: {
      NODE_ENV: "development"
    }
  }
});
