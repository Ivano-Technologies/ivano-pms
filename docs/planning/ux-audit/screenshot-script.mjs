/**
 * A.2 Screenshot audit script
 *
 * Captures desktop (1280×800) and mobile (390×844) screenshots of every
 * top-level route and saves them to docs/planning/ux-audit/screenshots/.
 *
 * Prerequisites:
 *   1. Dev server running (local) OR set BASE_URL to prod
 *   2. Auth state: node scripts/record-auth-state.mjs (see DEVELOPMENT.md)
 *      - The script reads auth.json via STORAGE_STATE env var (default: ./auth.json)
 *
 * Usage:
 *   node docs/planning/ux-audit/screenshot-script.mjs
 *
 *   BASE_URL=https://pms.techivano.com \
 *   STORAGE_STATE=./auth.json \
 *   node docs/planning/ux-audit/screenshot-script.mjs
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const STORAGE_STATE = process.env.STORAGE_STATE ?? path.join(process.cwd(), "auth.json");
const OUT_DIR = path.join(__dirname, "screenshots");

const ROUTES = [
  { name: "01-dashboard-overview",   path: "/dashboard" },
  { name: "02-bookings-calendar",    path: "/dashboard/bookings" },
  { name: "03-guests",               path: "/dashboard/guests" },
  { name: "04-units",                path: "/dashboard/units" },
  { name: "05-inbox",                path: "/dashboard/inbox" },
  { name: "06-reports",              path: "/dashboard/reports" },
  { name: "07-settings",             path: "/dashboard/settings" },
];

const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 800 },
  { label: "mobile",  width: 390,  height: 844  },
];

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      storageState: STORAGE_STATE,
      viewport: { width: viewport.width, height: viewport.height },
    });

    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE_URL}${route.path}`;
      console.log(`[${viewport.label}] ${url}`);

      await page.goto(url, { waitUntil: "networkidle", timeout: 15_000 });

      // Wait for Convex data to hydrate (skeleton → real data)
      await page.waitForTimeout(1_500);

      const filename = `${route.name}--${viewport.label}.png`;
      await page.screenshot({
        path: path.join(OUT_DIR, filename),
        fullPage: true,
      });

      console.log(`  → saved ${filename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${OUT_DIR}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
