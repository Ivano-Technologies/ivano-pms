import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

import { ResendOTP } from "./ResendOTP";

/**
 * Ivano PMS auth (Kezie lock 6 Oct 2026):
 * - Google OAuth primary
 * - Email OTP (resend-otp) secondary, no password
 * - Public sign up allowed (no invite allowlist)
 * - No GitHub / Apple / anonymous / password
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, ResendOTP]
});
