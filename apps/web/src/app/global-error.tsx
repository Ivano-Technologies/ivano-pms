"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/layout/error-screen";
import { reportError } from "@/lib/friendly-error";

import "./globals.css";

/**
 * IVA-189: replaces the root layout when it fails, so it brings its own html, body and styles.
 * Never shows error.message.
 */
export default function GlobalError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportError(error, "global-error");
  }, [error]);
  return (
    <html lang="en">
      <body>
        <title>Something went wrong | Ivano PMS</title>
        <ErrorScreen onRetry={unstable_retry} homeHref="/" />
      </body>
    </html>
  );
}
