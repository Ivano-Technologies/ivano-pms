import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign in"
};

/**
 * Convex Auth sign in (Lobby Light). Google primary + email OTP.
 * Public sign up via /sign-up and the Create an account link under the card.
 */
export default function SignInPage() {
  return (
    <AuthShell>
      <AuthCard mode="signIn" />
    </AuthShell>
  );
}
