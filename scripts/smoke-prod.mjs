/**
 * Production smoke checks for pms.techivano.com (run with real Chrome via Playwright).
 * Usage: node scripts/smoke-prod.mjs
 */
import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/web/.env.local") });

const BASE = "https://pms.techivano.com";
const EMAIL = process.env.SMOKE_EMAIL ?? "ivanonigeria@gmail.com";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}: ${detail}`);
}

async function signIn(page) {
  if (!CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY missing from apps/web/.env.local");
  }

  const usersRes = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(EMAIL)}`,
    { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } }
  );
  if (!usersRes.ok) {
    throw new Error(`Clerk user lookup failed: ${usersRes.status}`);
  }
  const users = await usersRes.json();
  const user = Array.isArray(users) ? users[0] : users;
  if (!user?.id) {
    throw new Error(`No Clerk user for ${EMAIL}`);
  }

  const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user_id: user.id })
  });
  if (!tokenRes.ok) {
    throw new Error(`Clerk sign-in token failed: ${tokenRes.status}`);
  }
  const tokenPayload = await tokenRes.json();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(
      `${BASE}/sign-in?__clerk_ticket=${encodeURIComponent(tokenPayload.token)}`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );
    await page.waitForTimeout(4000);
    if (!page.url().includes("/sign-in")) break;

    const retryRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: user.id })
    });
    if (retryRes.ok) {
      Object.assign(tokenPayload, await retryRes.json());
    }
  }

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByText("Gwarimpa Estate").waitFor({ timeout: 90000 });
}

async function testDashboardStability(page) {
  if (!page.url().includes("/dashboard")) {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  }
  await page.getByText("Gwarimpa Estate").waitFor({ timeout: 60000 });

  const startUrl = page.url();
  await page.waitForTimeout(30000);

  const crashed = await page
    .getByRole("heading", { name: /couldn't load/i })
    .isVisible()
    .catch(() => false);
  const stillOnDashboard = page.url().includes("/dashboard");
  const propertyVisible = await page
    .getByText("Gwarimpa Estate")
    .isVisible()
    .catch(() => false);

  const pass =
    !crashed && stillOnDashboard && propertyVisible && startUrl.includes("pms.techivano.com");
  record(
    "1. Dashboard stability (30s)",
    pass,
    pass
      ? `Stable for 30s with property data on ${page.url()}`
      : `crashed=${crashed} url=${page.url()} propertyVisible=${propertyVisible}`
  );
}

async function testChannelTokensWs(page) {
  const wsFrames = [];

  page.on("websocket", (ws) => {
    if (!ws.url().includes("convex")) return;
    ws.on("framereceived", (frame) => {
      const text = typeof frame.payload === "string" ? frame.payload : "";
      if (text) wsFrames.push(text);
    });
  });

  await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
  await page.getByText(/channel connections|whatsapp|telegram/i).first().waitFor({
    timeout: 30000
  }).catch(() => {});
  await page.waitForTimeout(12000);

  const pageAlive = !(await page
    .getByRole("heading", { name: /couldn't load/i })
    .isVisible()
    .catch(() => false));

  if (!pageAlive) {
    record("2. Channel tokens WS payload", false, "Page crashed before WS capture");
    return;
  }

  const combined = wsFrames.join("\n");
  const hasAccessToken =
    /"accessToken"\s*:/.test(combined) || /"refreshToken"\s*:/.test(combined);
  const sawChannelFields =
    combined.includes("isConnected") ||
    combined.includes("phoneNumberId") ||
    combined.includes("channelToken");

  const pass = pageAlive && !hasAccessToken && (sawChannelFields || wsFrames.length > 0);
  record(
    "2. Channel tokens WS payload",
    pass,
    hasAccessToken
      ? "Found accessToken/refreshToken in WS frames"
      : sawChannelFields
        ? `Public channel fields only across ${wsFrames.length} frame(s)`
        : `No token fields in ${wsFrames.length} captured frame(s)`
  );
}

async function testOverlapToast(page) {
  await page.goto(`${BASE}/dashboard/bookings`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Bookings" }).waitFor({ timeout: 30000 });
  await page
    .locator('[aria-label^="Create booking"]')
    .first()
    .waitFor({ timeout: 60000 });
  await page.waitForTimeout(2000);

  if (
    await page
      .getByRole("heading", { name: /couldn't load/i })
      .isVisible()
      .catch(() => false)
  ) {
    record("3. Overlap toast", false, "Page crashed on bookings");
    return;
  }

  // S201 has confirmed/pending booking Jul 10-17; Jul 9 empty cell + default 1-night checkout overlaps.
  const targetCell = page.getByRole("button", {
    name: "Create booking for S201 on 2026-07-08"
  });
  await targetCell.scrollIntoViewIfNeeded({ timeout: 20000 }).catch(() => {});
  if (!(await targetCell.isVisible({ timeout: 20000 }).catch(() => false))) {
    record(
      "3. Overlap toast",
      false,
      "Could not find empty calendar cell for S201 on 2026-07-08"
    );
    return;
  }
  await targetCell.click();

  await page.waitForTimeout(1500);

  const dialog = page.getByRole("dialog");
  if (!(await dialog.isVisible({ timeout: 5000 }).catch(() => false))) {
    record("3. Overlap toast", false, "Quick-create booking dialog did not open");
    return;
  }

  // Select first guest
  const guestSelect = dialog.locator("select").first();
  await guestSelect.selectOption({ index: 1 }).catch(() => {});

  const checkout = dialog.locator('input[type="date"]').first();
  await checkout.fill("2026-07-12");

  const createBtn = dialog.getByRole("button", { name: /create booking/i });
  await createBtn.click();
  await page.waitForTimeout(3000);

  const toastText = await page
    .locator('[data-sonner-toast], [role="status"]')
    .allTextContents()
    .catch(() => []);
  const bodyText = await page.locator("body").innerText();
  const combined = [...toastText, bodyText].join(" ");
  const successToast = /Booking created/i.test(combined);
  const overlapHit =
    /Unit already booked for these dates/i.test(combined) ||
    (/Server Error/i.test(combined) && /createBooking/i.test(combined));

  record(
    "3. Overlap toast",
    overlapHit && !successToast,
    overlapHit && !successToast
      ? "Booking creation rejected (overlap enforced)"
      : successToast
        ? "Booking was created unexpectedly"
        : `No rejection signal found. Snippets: ${combined.slice(0, 200)}`
  );
}

async function testPropertySwitcher(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  if (
    await page
      .getByRole("heading", { name: /couldn't load/i })
      .isVisible()
      .catch(() => false)
  ) {
    record("4. Property switcher hidden (single property)", false, "Page crashed");
    return;
  }

  const switcher = page.getByLabel("Select property");
  const visible = await switcher.isVisible().catch(() => false);

  // With one seeded property, switcher should NOT render
  record(
    "4. Property switcher hidden (single property)",
    !visible,
    visible ? "Property switcher is visible (expected hidden for 1 property)" : "No property switcher visible"
  );
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await signIn(page);
    record("0. Sign-in", true, `Signed in as ${EMAIL}`);
  } catch (err) {
    record("0. Sign-in", false, err instanceof Error ? err.message : String(err));
    await browser.close();
    process.exit(1);
  }

  try {
    await testDashboardStability(page);
  } catch (err) {
    record(
      "1. Dashboard stability (30s)",
      false,
      err instanceof Error ? err.message : String(err)
    );
  }
  try {
    await testChannelTokensWs(page);
  } catch (err) {
    record(
      "2. Channel tokens WS payload",
      false,
      err instanceof Error ? err.message : String(err)
    );
  }
  try {
    await testOverlapToast(page);
  } catch (err) {
    record("3. Overlap toast", false, err instanceof Error ? err.message : String(err));
  }
  try {
    await testPropertySwitcher(page);
  } catch (err) {
    record(
      "4. Property switcher hidden (single property)",
      false,
      err instanceof Error ? err.message : String(err)
    );
  }

  await browser.close();

  console.log("\n--- SUMMARY ---");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} | ${r.name} | ${r.detail}`);
  }

  const failed = results.filter((r) => !r.pass);
  process.exit(failed.length ? 1 : 0);
}

main();
