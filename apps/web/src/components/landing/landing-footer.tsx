import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";
import { BRAND_COPYRIGHT, BRAND_FOOTER } from "@/lib/brand";

import { AuthCta } from "./auth-cta";

export function ReadyBand() {
  return (
    <section
      className="bg-ink mb-14 flex flex-col items-start justify-between gap-6 rounded-[20px] px-6 py-[30px] text-white sm:flex-row sm:items-center sm:px-12 sm:py-11"
      data-surface="ink"
      aria-labelledby="ready-heading"
    >
      <div>
        <h2
          id="ready-heading"
          className="font-display text-[26px] leading-8 font-medium sm:text-[34px] sm:leading-10"
        >
          Ready for today’s arrivals?
        </h2>
        <p className="mt-1.5 text-[17px] text-[#C9CFD6]">Sign in to open your front desk.</p>
      </div>
      <AuthCta className="w-full sm:w-auto" />
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-line border-t pt-[26px] pb-[34px]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10">
        <IvanoPmsLockup className="h-[33px]" />
        <p className="text-muted-foreground text-[13px] font-medium">{BRAND_FOOTER}</p>
        <p className="text-muted-foreground text-[13px] font-medium">{BRAND_COPYRIGHT}</p>
      </div>
    </footer>
  );
}
