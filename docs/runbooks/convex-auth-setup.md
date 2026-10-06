# Convex Auth setup (Ivano PMS)

Replaces Clerk. Providers: **Google** (primary) + **email OTP** via Resend (`resend-otp`). Public sign up is allowed. No password, GitHub, Apple or anonymous.

## Convex dashboard env (dev + prod)

| Variable | Notes |
|----------|--------|
| `SITE_URL` | App origin. Prod: `https://pms.techivano.com`. Local: `http://localhost:3000`. Preview: the Vercel Preview URL for OAuth return. |
| `JWT_PRIVATE_KEY` | From `node scripts/generate-auth-keys.mjs` (do not commit). |
| `JWKS` | Same script output. |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth Web client ID. |
| `AUTH_GOOGLE_SECRET` | Google Cloud OAuth Web client secret. |
| `AUTH_RESEND_KEY` | Resend API key for OTP email. |
| `AUTH_EMAIL_FROM` | Optional. Default `Ivano PMS <signin@techivano.com>` (must be a verified Resend sender). |

`CONVEX_SITE_URL` is set by Convex automatically and is the JWT issuer in `convex/auth.config.ts`.

## Google Cloud

1. Google Auth Platform → create or open a project → configure OAuth consent (External for public sign up).
2. Clients → Create client → Web application.
3. Authorized redirect URI (per Convex deployment):
   `https://<deployment>.convex.site/api/auth/callback/google`
   Find the `.site` URL on the Convex dashboard (HTTP Actions URL).
4. For local/Preview, add matching `SITE_URL` origins as needed.
5. Paste Client ID / Secret into Convex env as above.

## Resend

1. Create an API key; set `AUTH_RESEND_KEY` on Convex.
2. Verify the from-domain (or use a Resend test sender in dev).
3. OTP emails use an 8 digit code, 15 minute expiry.

## Vercel (apps/web)

| Remove | Add / keep |
|--------|------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CONVEX_URL` (unchanged) |
| `CLERK_SECRET_KEY` | `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | |
| `CLERK_JWT_ISSUER_DOMAIN` (Convex) | |

No Clerk keys remain on Vercel or Convex after cutover.

## Smoke

1. `/sign-in` shows IV1 mark, Continue with Google, email + Continue, "New here? Create an account".
2. Google OAuth round-trips to `/dashboard`.
3. Email OTP: send code → enter code → dashboard.
4. `/sign-up` uses the same providers with Create account copy.
