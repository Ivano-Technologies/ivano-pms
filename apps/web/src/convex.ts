import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

if (!convexUrl) {
  console.warn("NEXT_PUBLIC_CONVEX_URL is not set — Convex client unavailable.");
}

export const convex = new ConvexReactClient(convexUrl ?? "https://placeholder.convex.cloud");
