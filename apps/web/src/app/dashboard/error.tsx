"use client";

import { useEffect } from "react";

import { ErrorScreen } from "@/components/layout/error-screen";
import { reportError } from "@/lib/friendly-error";

/** IVA-189: keeps the dashboard shell and shows a friendly message. Never shows error.message. */
export default function DashboardError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportError(error, "dashboard/error");
  }, [error]);
  return <ErrorScreen onRetry={unstable_retry} homeHref="/dashboard" variant="section" />;
}
