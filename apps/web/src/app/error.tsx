"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/layout/error-screen";
import { reportError } from "@/lib/friendly-error";

/** IVA-189: friendly page for errors under the root layout. Never shows error.message. */
export default function RootError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportError(error, "app/error");
  }, [error]);
  return <ErrorScreen onRetry={unstable_retry} homeHref="/" />;
}
