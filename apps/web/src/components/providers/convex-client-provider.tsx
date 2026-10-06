"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

const convex = new ConvexReactClient(
  convexUrl ?? "https://placeholder.convex.cloud"
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>
  );
}
