import type { MetadataRoute } from "next";

import { absoluteUrl, PUBLIC_PATHS } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly",
    priority: 1
  }));
}
