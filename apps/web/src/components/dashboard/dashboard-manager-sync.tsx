"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";

import { api } from "../../../../../convex/_generated/api";

export function DashboardManagerSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const upsertManager = useMutation(api.functions.managers.upsertManagerFromAuth);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    void upsertManager({}).catch((error: unknown) => {
      console.error("Failed to sync manager profile:", error);
    });
  }, [isLoading, isAuthenticated, upsertManager]);

  return null;
}
