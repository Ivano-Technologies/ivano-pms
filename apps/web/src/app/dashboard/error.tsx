"use client";

import { ErrorScreen, useReportedErrorRef } from "@/components/layout/error-screen";

/** IVA-189: keeps the dashboard shell and shows a friendly message. Never shows error.message. */
export default function DashboardError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const errorRef = useReportedErrorRef(error, "dashboard/error");
  return <ErrorScreen onRetry={unstable_retry} homeHref="/dashboard" variant="section" errorRef={errorRef} />;
}
