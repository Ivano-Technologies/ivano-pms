import Link from "next/link";

import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";

import { AuthCta } from "./auth-cta";

export function LandingNav() {
  return (
    <nav
      className="flex h-[62px] items-center justify-between sm:h-[76px]"
      aria-label="Main"
    >
      <Link href="/" aria-label="Ivano PMS home" className="rounded-md">
        <IvanoPmsLockup title={null} className="h-[34px] sm:h-10" />
      </Link>
      <div className="flex items-center gap-7">
        <a
          href="#features"
          className="text-muted-foreground hover:text-ink hidden text-[15px] font-medium sm:inline"
        >
          Features
        </a>
        <a
          href="#how-it-works"
          className="text-muted-foreground hover:text-ink hidden text-[15px] font-medium sm:inline"
        >
          How it works
        </a>
        <AuthCta withArrow={false} className="h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-[15px]" />
      </div>
    </nav>
  );
}
