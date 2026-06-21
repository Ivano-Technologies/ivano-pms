import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const contextPath = path.join(__dirname, ".e2e-context.json");

function loadEnv() {
  dotenv.config({ path: path.join(webRoot, ".env.local") });
}

function getInternalJobSecret() {
  const secret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!secret) {
    throw new Error("INTERNAL_JOB_SECRET is required for webhook E2E tests");
  }
  return secret;
}

function parseConvexRunOutput(output) {
  const jsonPropertyMatch = output.match(/"propertyId"\s*:\s*"([^"]+)"/);
  if (jsonPropertyMatch?.[1]) {
    return { propertyId: jsonPropertyMatch[1] };
  }

  const jsPropertyMatch = output.match(/propertyId:\s*['"]([^'"]+)['"]/);
  if (jsPropertyMatch?.[1]) {
    return { propertyId: jsPropertyMatch[1] };
  }

  const lines = output
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line?.startsWith("{")) {
      continue;
    }
    try {
      const parsed = JSON.parse(line);
      if (parsed.propertyId) {
        return { propertyId: parsed.propertyId };
      }
    } catch {
      continue;
    }
  }

  throw new Error(`Could not parse seedReset output:\n${output}`);
}

export default async function globalSetup() {
  loadEnv();

  if (process.env.WEBHOOK_E2E_SKIP_SEED === "1") {
    return;
  }

  const secret = getInternalJobSecret();
  const output = execSync(
    `npx convex run seed:seedReset ${JSON.stringify({ secret })}`,
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  fs.writeFileSync(contextPath, JSON.stringify(parseConvexRunOutput(output), null, 2));
}
