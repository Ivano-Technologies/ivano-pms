import type { Metadata } from "next";

import { FeatureTrio } from "@/components/landing/feature-trio";
import { Hero } from "@/components/landing/hero";
import { LandingFooter, ReadyBand } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { pmsJsonLd, serializeJsonLd } from "@/lib/seo";

// Title, description and og tags come from the root layout unchanged.
export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return (
    <div className="bg-paper text-ink flex min-h-screen flex-col overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pmsJsonLd()) }}
      />
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-10">
        <LandingNav />
        <main>
          <Hero />
          <FeatureTrio />
          <ReadyBand />
        </main>
      </div>
      <LandingFooter />
    </div>
  );
}
