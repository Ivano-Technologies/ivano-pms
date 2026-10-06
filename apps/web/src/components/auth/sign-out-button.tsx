"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <button
      type="button"
      className="border-border text-ink hover:bg-sunken inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold"
      onClick={() => {
        void signOut().then(() => router.replace("/sign-in"));
      }}
    >
      Sign out
    </button>
  );
}
