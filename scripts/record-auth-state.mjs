/**
 * Record Playwright storage state for UX screenshots and local auth tooling.
 *
 * Usage:
 *   node scripts/record-auth-state.mjs
 *
 * Environment (auto-detected from Clerk key prefix unless overridden):
 *   pk_test_/sk_test_ → BASE_URL http://localhost:3000, email DEV_SMOKE_EMAIL
 *   pk_live_/sk_live_ → BASE_URL https://pms.techivano.com, email PROD_SMOKE_EMAIL or SMOKE_EMAIL
 *
 * Overrides:
 *   BASE_URL=...           force target app URL
 *   STORAGE_STATE=...      output path (default: ./auth.json at repo root)
 *   DEV_SMOKE_EMAIL=...    Clerk user in development instance
 *   PROD_SMOKE_EMAIL=...   Clerk user in production instance
 *   SMOKE_EMAIL=...        legacy alias (used when profile-specific email unset)
 *   RECORD_AUTH_FORCE=1    allow pk_live_ against localhost (not recommended)
 */
import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  dotenv.config({ path: path.join(root, "apps/web/.env.local") });
  dotenv.config({
    path: path.join(root, "apps/web/.env.development.local"),
    override: true
  });
}

function clerkKeyProfile() {
  const publishable =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY ??
    "";
  const secret = process.env.CLERK_SECRET_KEY ?? "";

  if (publishable.startsWith("pk_test_") || secret.startsWith("sk_test_")) {
    return "development";
  }
  if (publishable.startsWith("pk_live_") || secret.startsWith("sk_live_")) {
    return "production";
  }
  return "unknown";
}

function resolveTarget(profile) {
  const forcedBase = process.env.BASE_URL?.trim();
  const defaultBase =
    profile === "development"
      ? "http://localhost:3000"
      : "https://pms.techivano.com";

  const baseUrl = forcedBase || defaultBase;
  const isLocalhost = /^https?:\/\/localhost(?::\d+)?/i.test(baseUrl);

  if (
    profile === "production" &&
    isLocalhost &&
    process.env.RECORD_AUTH_FORCE !== "1"
  ) {
    throw new Error(
      "Refusing to record production Clerk session (pk_live_/sk_live_) against localhost. " +
        "Use Clerk development keys in apps/web/.env.development.local, or set " +
        "BASE_URL=https://pms.techivano.com, or RECORD_AUTH_FORCE=1 to override."
    );
  }

  if (profile === "development" && !isLocalhost && !forcedBase) {
    console.warn(
      "[record-auth-state] Development Clerk keys detected; using localhost. " +
        "Set BASE_URL explicitly to target another host."
    );
  }

  const email =
    profile === "development"
      ? process.env.DEV_SMOKE_EMAIL ??
        process.env.SMOKE_EMAIL ??
        "ivanonigeria@gmail.com"
      : process.env.PROD_SMOKE_EMAIL ??
        process.env.SMOKE_EMAIL ??
        "ivanonigeria@gmail.com";

  return { baseUrl, email, profile };
}

async function signIn(page, { baseUrl, email, clerkSecretKey }) {
  if (!clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY missing from apps/web env files");
  }

  const usersRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${clerkSecretKey}` } }
  );
  if (!usersRes.ok) {
    throw new Error(`Clerk user lookup failed: ${usersRes.status}`);
  }
  const users = await usersRes.json();
  const user = Array.isArray(users) ? users[0] : users;
  if (!user?.id) {
    throw new Error(
      `No Clerk user for ${email} in the active Clerk instance (${clerkKeyProfile()}). ` +
        (clerkKeyProfile() === "development"
          ? "Create a dev-instance user (step 2) or set DEV_SMOKE_EMAIL."
          : "Set PROD_SMOKE_EMAIL or SMOKE_EMAIL.")
    );
  }

  const createToken = async () => {
    const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: user.id })
    });
    if (!tokenRes.ok) {
      throw new Error(`Clerk sign-in token failed: ${tokenRes.status}`);
    }
    return tokenRes.json();
  };

  let tokenPayload = await createToken();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(
      `${baseUrl}/sign-in?__clerk_ticket=${encodeURIComponent(tokenPayload.token)}`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );
    await page.waitForTimeout(4000);
    if (!page.url().includes("/sign-in")) break;
    tokenPayload = await createToken();
  }

  await page.goto(`${baseUrl}/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
  await page.waitForURL("**/dashboard**", { timeout: 90000 });
}

loadEnv();

const profile = clerkKeyProfile();
const target = resolveTarget(profile);
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const out =
  process.env.STORAGE_STATE ?? path.join(root, "auth.json");

console.log(
  `[record-auth-state] profile=${profile} base=${target.baseUrl} email=${target.email}`
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await signIn(page, { ...target, clerkSecretKey });
await context.storageState({ path: out });
await browser.close();

console.log(`Saved auth state to ${out}`);
