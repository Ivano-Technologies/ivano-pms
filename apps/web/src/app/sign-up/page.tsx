import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create account"
};

/**
 * Convex Auth sign up (same providers as sign in). Public registration allowed.
 */
export default function SignUpPage() {
  return (
    <AuthShell>
      <AuthCard mode="signUp" />
    </AuthShell>
  );
}
