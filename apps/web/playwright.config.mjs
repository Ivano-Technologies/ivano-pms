import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { defineConfig } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./e2e",
  timeout: 10_000,
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/global-setup.mjs",
  use: {
    baseURL: process.env.WEBHOOK_TEST_URL ?? "http://localhost:3000"
  },
  projects: [
    {
      name: "webhooks",
      testMatch: /webhooks\.spec\.mjs/
    }
  ]
});
