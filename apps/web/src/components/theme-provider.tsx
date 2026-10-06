"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

const STORAGE_KEY = "ivano-pms-theme";

/**
 * Lobby Light is light only for now. next-themes stays wired so the parked dark
 * mode (Option B) can return later without plumbing work.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      storageKey={STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
