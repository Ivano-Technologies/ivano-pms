import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { pmsJsonLd } from "@/lib/seo";

describe("PMS SEO surfaces", () => {
  it("robots blocks dashboard, auth and API routes and points at the sitemap", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(["/dashboard", "/sign-in", "/sign-up", "/api/"]);
    expect(r.sitemap).toBe("https://pms.techivano.com/sitemap.xml");
  });

  it("sitemap lists only the public home page", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual(["https://pms.techivano.com"]);
  });

  it("JSON-LD describes Ivano PMS and its publisher", () => {
    const graph = pmsJsonLd()["@graph"] as Record<string, unknown>[];
    expect(graph.find((node) => node["@type"] === "SoftwareApplication")).toMatchObject({
      name: "Ivano PMS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://pms.techivano.com",
      publisher: {
        "@type": "Organization",
        name: "Ivano Technologies",
        url: "https://www.ivanotechnologies.com"
      }
    });
    expect(graph.find((node) => node["@type"] === "WebSite")).toMatchObject({
      name: "Ivano PMS",
      url: "https://pms.techivano.com"
    });
  });
});
