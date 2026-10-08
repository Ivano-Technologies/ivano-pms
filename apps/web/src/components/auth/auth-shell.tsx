import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignInRibbon } from "@/components/auth/sign-in-ribbon";
import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";
import { IvanoCopyright } from "@/components/brand/ivano-copyright";

export function AuthShell({
  children,
  mode = "signIn"
}: {
  children: ReactNode;
  mode?: "signIn" | "signUp";
}) {
  const isSignUp = mode === "signUp";

  return (
    <div className="bg-paper grid min-h-screen flex-1 grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-1">
      <aside
        className="bg-ink flex flex-col px-5 pt-5 pb-14 text-white lg:justify-between lg:px-[52px] lg:py-11"
        data-surface="ink"
      >
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Ivano PMS home" className="rounded-md">
            <IvanoPmsLockup tone="navy" title={null} className="h-9 lg:h-11" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md text-[13px] font-semibold text-white lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </div>
        <div className="mt-[22px] lg:mt-0">
          {isSignUp ? (
            <>
              <h2 className="font-display max-w-[11em] text-[28px] leading-[34px] font-medium tracking-[-0.01em] lg:max-w-none lg:text-[42px] lg:leading-[48px]">
                Welcome. Your <br className="hidden lg:block" />
                <em className="text-[#E2B866] italic">front desk</em> starts here.
              </h2>
              <p className="mt-3 max-w-[26em] text-[15px] leading-[22px] text-[#C9CFD6] lg:text-[17px] lg:leading-[26px]">
                Create an account to see arrivals, in house guests and messages in one place.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display max-w-[11em] text-[28px] leading-[34px] font-medium tracking-[-0.01em] lg:max-w-none lg:text-[42px] lg:leading-[48px]">
                Good to see you. Today’s <br className="hidden lg:block" />
                <em className="text-[#E2B866] italic">arrivals</em> are waiting.
              </h2>
              <p className="mt-3 max-w-[26em] text-[15px] leading-[22px] text-[#C9CFD6] lg:text-[17px] lg:leading-[26px]">
                Sign in to see who is arriving, who is in house and who is leaving, with every guest
                message in one place.
              </p>
            </>
          )}
          <SignInRibbon className="mt-[30px] hidden lg:block" />
        </div>
        <IvanoCopyright variant="navy" className="hidden lg:block" />
      </aside>

      <main className="relative -mt-8 flex flex-col items-center justify-start px-4 pb-7 lg:mt-0 lg:justify-center lg:p-10">
        <Link
          href="/"
          className="text-ink absolute top-7 right-9 hidden items-center gap-2 rounded-md text-sm font-semibold lg:inline-flex"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
        {children}
        <IvanoCopyright className="mt-2.5 text-center lg:hidden" />
      </main>
    </div>
  );
}
