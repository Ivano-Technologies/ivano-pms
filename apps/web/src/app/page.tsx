import { FeatureTrio } from "@/components/landing/feature-trio";
import { Hero } from "@/components/landing/hero";
import { LandingFooter, ReadyBand } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";

export default function HomePage() {
  return (
    <div className="bg-paper text-ink flex min-h-screen flex-col overflow-x-clip">
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
