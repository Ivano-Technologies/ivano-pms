import type { AuthConfig } from "convex/server";

/**
 * Convex Auth JWT issuer. CONVEX_SITE_URL is set automatically on Convex deployments.
 * @see https://labs.convex.dev/auth/setup/manual
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex"
    }
  ]
} satisfies AuthConfig;
