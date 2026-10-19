"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { api } from "../../../../../convex/_generated/api";
import { NoAccessScreen } from "@/components/dashboard/no-access-screen";
import { generateErrorRef, reportError } from "@/lib/friendly-error";

/**
 * IVA-194: links the signed-in user to their manager row (upsertManagerFromAuth never creates
 * one), then renders the dashboard only when a manager row exists. Otherwise it shows
 * the no access screen instead of letting every dashboard query fail.
 */
export function DashboardAccessGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const linkManager = useMutation(api.functions.managers.upsertManagerFromAuth);
  const profile = useQuery(
    api.functions.managers.getCurrentManagerProfile,
    isAuthenticated ? {} : "skip"
  );
  const [linkDone, setLinkDone] = useState(false);
  const [linkErrorRef, setLinkErrorRef] = useState<string | null>(null);
  // A ready ref for the no access screen, used when linking did not fail with its own ref.
  const [freshRef] = useState(() => generateErrorRef());
  const started = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || started.current) return;
    started.current = true;
    linkManager({})
      .catch((error: unknown) => {
        setLinkErrorRef(reportError(error, "dashboard/link-manager"));
      })
      .finally(() => setLinkDone(true));
  }, [isLoading, isAuthenticated, linkManager]);

  const showNoAccess = linkDone && profile === null;

  const noAccessRef = linkErrorRef ?? freshRef;
  const logged = useRef(false);

  // Log the ref once when the screen shows, so support can find this sign in. A link failure was
  // already logged with its ref by reportError.
  useEffect(() => {
    if (!showNoAccess || linkErrorRef || logged.current) return;
    logged.current = true;
    console.warn(`[no-access] ref=${freshRef} signed in user has no manager row`);
  }, [showNoAccess, linkErrorRef, freshRef]);

  if (profile) {
    return <>{children}</>;
  }
  if (showNoAccess) {
    return <NoAccessScreen errorRef={noAccessRef} />;
  }
  return (
    <div
      className="bg-paper flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Loading your dashboard"
      data-testid="dashboard-access-loading"
    >
      <div className="bg-muted h-24 w-full max-w-[420px] animate-pulse rounded-[20px]" />
    </div>
  );
}
