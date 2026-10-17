"use client";

import { ErrorScreen, useReportedErrorRef } from "@/components/layout/error-screen";

/** IVA-189: friendly page for errors under the root layout. Never shows error.message. */
export default function RootError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const errorRef = useReportedErrorRef(error, "app/error");
  return <ErrorScreen onRetry={unstable_retry} homeHref="/" errorRef={errorRef} />;
}
