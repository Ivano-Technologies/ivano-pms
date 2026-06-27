import { chromium } from "@playwright/test";
import path from "node:path";

const auth = path.join(process.cwd(), "auth.json");
const shot = path.join(process.cwd(), "docs/planning/ux-audit/screenshots/inbox-threads-verify.png");

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: auth, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});

let redirects = 0;
page.on("response", (r) => {
  if ([301, 302, 307, 308].includes(r.status())) redirects++;
});

await page.goto("http://localhost:3000/dashboard/inbox", {
  waitUntil: "networkidle",
  timeout: 60000
});
await page.waitForTimeout(5000);

const url = page.url();
const signedIn = !url.includes("/sign-in");
const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 700);

// Probe inbox-specific UI
const hasInboxHeading = await page.getByRole("heading", { name: /inbox/i }).count();
const hasThreadList = await page.getByLabel(/guest threads|loading threads/i).count();
const hasReplyBox = await page.getByLabel(/reply message/i).count();

await page.screenshot({ path: shot, fullPage: false });

console.log(JSON.stringify({
  url,
  signedIn,
  redirects,
  hasInboxHeading,
  hasThreadList,
  hasReplyBox,
  consoleErrors: consoleErrors.slice(0, 8),
  bodyText
}, null, 2));

await browser.close();
