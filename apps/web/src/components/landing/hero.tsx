import { House } from "lucide-react";

import { AuthCta } from "./auth-cta";
import { lobbyButton } from "./lobby-button";
import { StayRibbonPreview } from "./stay-ribbon-preview";

export function Hero() {
  return (
    <section
      className="grid grid-cols-1 items-center gap-7 pt-5 pb-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-12 lg:pt-10 lg:pb-16"
      aria-labelledby="hero-heading"
    >
      <div>
        <span className="border-line text-muted-foreground inline-flex h-[30px] items-center gap-2 rounded-full border bg-white px-3 text-[13px] font-semibold">
          <i className="bg-sage size-2 rounded-full" aria-hidden />
          Hospitality property management
        </span>
        <h1
          id="hero-heading"
          className="font-display text-ink mt-4 mb-3.5 text-[36px] leading-[42px] font-medium tracking-[-0.02em] sm:mt-[22px] sm:mb-5 sm:text-[52px] sm:leading-[58px]"
        >
          Run your property
          <br className="hidden sm:block" /> from one{" "}
          <em className="text-terracotta italic">calm</em> desk
        </h1>
        <p className="text-muted-foreground max-w-[30em] text-base leading-[25px] sm:text-[19px] sm:leading-[30px]">
          Bookings, guests, rooms and every guest message in one place. Built for hotels,
          serviced apartments and short lets.
        </p>
        <div className="mt-[30px] flex flex-col gap-3 sm:flex-row">
          <AuthCta className="h-12 w-full sm:h-11 sm:w-auto" />
          <a href="#today" className={lobbyButton("secondary", "h-12 w-full sm:h-11 sm:w-auto")}>
            See today at a glance
          </a>
        </div>
        <p className="text-muted-foreground mt-[22px] flex items-center gap-2 text-sm font-medium">
          <House className="size-4" aria-hidden />
          Made in Abuja Nigeria by Ivano Technologies
        </p>
      </div>
      <div id="today" className="scroll-mt-6">
        <StayRibbonPreview />
      </div>
    </section>
  );
}
