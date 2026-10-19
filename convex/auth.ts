import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

import { googleProfile } from "./lib/googleProfile";
import { ResendOTP } from "./ResendOTP";

/**
 * Ivano PMS auth (Kezie lock 6 Oct 2026):
 * - Google OAuth primary
 * - Email OTP (resend-otp) secondary, no password
 * - Public sign up allowed (no invite allowlist)
 * - No GitHub / Apple / anonymous / password
 * - Google email counts as verified only when Google says email_verified === true (IVA-194).
 *   Email OTP marks the email verified when the code is checked (library verifyCodeAndSignIn).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google({ profile: (claims) => googleProfile(claims) }), ResendOTP]
});
