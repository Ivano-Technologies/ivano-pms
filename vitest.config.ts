import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "./apps/web/vitest.unit.config.ts",
      "./convex/vitest.config.ts",
      "./workers/email-inbound/vitest.config.ts"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "apps/web/src/lib/calendar-utils.ts",
        "apps/web/src/lib/booking-status-colors.ts",
        "apps/web/src/components/bookings/booking-calendar.tsx",
        "convex/functions/bookings.ts",
        "convex/functions/units.ts",
        "convex/lib/auth.ts",
        "convex/lib/customFunctions.ts"
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/_generated/**"],
      thresholds: {
        lines: 60,
        branches: 50
      }
    }
  }
});
