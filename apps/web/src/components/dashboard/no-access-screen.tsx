"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Iv1Mark } from "@/components/brand/iv1-mark";
import { ErrorRef } from "@/components/ui/error-ref";

/** IVA-194: Coco's copy for a signed-in user with no manager row. Edit the wording here only. */
export const NO_ACCESS_COPY = {
  title: "You're signed in, but there's nothing here yet.",
  body: "Ask your property manager to add you, or contact us to set up your property.",
  action: "Sign out"
} as const;

/**
 * IVA-194: shown when a signed-in user has no manager row. One action (Sign out) and the muted
 * support ref, which the gate logged. There is no onboarding step yet, so no property is created.
 */
export function NoAccessScreen({ errorRef }: { errorRef: string }) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    actionRef.current?.focus();
  }, []);

  return (
    <div className="bg-paper flex min-h-screen w-full items-center justify-center px-5 py-10">
      <div
        data-testid="no-access-screen"
        className="border-border w-full max-w-[420px] rounded-[20px] border bg-white px-9 pt-[34px] pb-7 text-center shadow-[var(--shadow-e3)] max-sm:rounded-2xl max-sm:px-[22px]"
      >
        <div className="mb-5 flex justify-center">
          <Iv1Mark className="h-[29px] w-auto" title="Ivano PMS" />
        </div>
        <h1 className="font-display text-ink text-[26px] leading-8 font-medium max-sm:text-2xl">
          {NO_ACCESS_COPY.title}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-[22px]">
          {NO_ACCESS_COPY.body}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            ref={actionRef}
            type="button"
            onClick={() => {
              void signOut().then(() => router.replace("/sign-in"));
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-primary inline-flex h-[46px] items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold shadow-[var(--shadow-e1)] focus:outline-2 focus:outline-offset-2 max-sm:w-full"
          >
            <LogOut className="size-4" aria-hidden />
            {NO_ACCESS_COPY.action}
          </button>
        </div>
        <ErrorRef code={errorRef} className="mt-4" />
      </div>
    </div>
  );
}
