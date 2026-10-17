import { BRAND_COMPANY, BRAND_NAME } from "@/lib/brand";

/**
 * Production origin for canonical links, robots, sitemap and JSON-LD.
 * Fixed rather than NEXT_PUBLIC_APP_URL so previews still canonicalise to
 * production.
 */
export const CANONICAL_ORIGIN = "https://pms.techivano.com";

/** Public pages that exist in src/app (everything else is auth or dashboard). */
export const PUBLIC_PATHS = ["/"] as const;

/** Dashboard, auth and API routes kept out of crawling. */
export const PRIVATE_ROUTE_PREFIXES = ["/dashboard", "/sign-in", "/sign-up", "/api/"] as const;

const IVANO_URL = "https://www.ivanotechnologies.com";

export function absoluteUrl(path: string): string {
  return path === "/" ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${path}`;
}

/** Home page structured data: SoftwareApplication + WebSite. */
export function pmsJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${CANONICAL_ORIGIN}/#software`,
        name: BRAND_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: CANONICAL_ORIGIN,
        publisher: {
          "@type": "Organization",
          name: BRAND_COMPANY,
          url: IVANO_URL
        }
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        name: BRAND_NAME,
        url: CANONICAL_ORIGIN
      }
    ]
  };
}

/** JSON for a script tag, escaping "<" so the payload cannot close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
