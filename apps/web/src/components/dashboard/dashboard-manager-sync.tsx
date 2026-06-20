"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";

import { api } from "../../../../../convex/_generated/api";

export function DashboardManagerSync() {
  const { user, isLoaded } = useUser();
  const upsertManager = useMutation(api.functions.managers.upsertManagerFromClerk);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    void upsertManager({
      email: user.primaryEmailAddress?.emailAddress ?? "",
      fullName:
        user.fullName ??
        [user.firstName, user.lastName].filter(Boolean).join(" ") ??
        "Manager",
      phone: user.primaryPhoneNumber?.phoneNumber
    }).catch((error: unknown) => {
      console.error("Failed to sync manager profile:", error);
    });
  }, [isLoaded, user, upsertManager]);

  return null;
}
