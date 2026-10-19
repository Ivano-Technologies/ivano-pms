/**
 * Google profile mapping for Convex Auth (IVA-194, Chief approved).
 *
 * @convex-dev/auth 0.0.90 decides OAuth email verification in
 * implementation/users.js (defaultCreateOrUpdateUser):
 *   emailVerified = profile.emailVerified ?? (oauth/oidc && allowDangerousEmailAccountLinking !== false)
 * and only then writes `emailVerificationTime` on the users record. Without a profile() callback
 * every Google email counts as verified. We return an explicit boolean so Google's own
 * `email_verified` claim decides: true only when the claim is exactly `true`. Leaving the field
 * undefined would fall back to "verified".
 *
 * The rest mirrors the library's defaultProfile (provider_utils.js).
 */
export type GoogleClaims = {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  email_verified?: unknown;
  picture?: string;
};

export function googleProfile(claims: GoogleClaims) {
  const id = claims.sub ?? claims.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Google profile is missing a subject id");
  }
  return {
    id,
    name: claims.name ?? undefined,
    email: claims.email ?? undefined,
    image: claims.picture ?? undefined,
    emailVerified: claims.email_verified === true
  };
}
