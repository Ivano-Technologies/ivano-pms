import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/web/.env.local") });

const BASE = "https://pms.techivano.com";
const EMAIL = "ivanonigeria@gmail.com";
const key = process.env.CLERK_SECRET_KEY;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
let convexWsUrl = "";
page.on("websocket", (ws) => {
  if (ws.url().includes("convex")) convexWsUrl = ws.url();
});
const users = await (
  await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(EMAIL)}`,
    { headers: { Authorization: `Bearer ${key}` } }
  )
).json();
const token = await (
  await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user_id: users[0].id })
  })
).json();

await page.goto(
  `${BASE}/sign-in?__clerk_ticket=${encodeURIComponent(token.token)}`,
  { waitUntil: "networkidle" }
);
await page.waitForTimeout(3000);
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const clerkToken = await page.evaluate(async () => {
  const clerk = window.Clerk;
  if (!clerk?.session) return null;
  return clerk.session.getToken({ template: "convex" });
});
console.log("clerk convex token present", Boolean(clerkToken));

if (clerkToken) {
  const res = await fetch("https://flippant-eel-758.convex.cloud/api/mutation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`
    },
    body: JSON.stringify({
      path: "functions/managers:upsertManagerFromClerk",
      args: {
        email: "ivanonigeria@gmail.com",
        fullName: "Ivano Technologies"
      },
      format: "json"
    })
  });
  const headers = Object.fromEntries(res.headers.entries());
  console.log("mutation status", res.status, headers);
  console.log("mutation body", (await res.text()).slice(0, 500));
}

await page.waitForTimeout(25000);
console.log("convex ws", convexWsUrl);
console.log((await page.locator("body").innerText()).slice(0, 1500));

await page.goto(`${BASE}/dashboard/bookings`, { waitUntil: "networkidle" });
await page.waitForTimeout(10000);
const labels = await page
  .locator('[aria-label^="Create booking for S201"]')
  .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
console.log(
  "S201 july cells",
  labels.filter((l) => l?.includes("2026-07")).slice(0, 20)
);

await browser.close();
