"use client";

import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Iv1Mark } from "@/components/brand/iv1-mark";
import { cn } from "@/lib/utils";

export const ERROR_SCREEN_COPY = {
  errorTitle: "Something went wrong",
  errorBody: "We hit a problem loading this page. Please try again.",
  notFoundTitle: "Page not found",
  notFoundBody: "The page you're looking for doesn't exist or has moved."
} as const;

const primaryClass =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[46px] items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold shadow-[var(--shadow-e1)]";
const secondaryClass =
  "border-line2 text-ink hover:bg-muted inline-flex h-[46px] items-center justify-center gap-2 rounded-lg border bg-white px-5 text-[15px] font-semibold";

/**
 * IVA-189: friendly full page or in shell message for error.tsx, global-error.tsx and
 * not-found.tsx. Never renders error.message, digests or stack traces.
 */
export function ErrorScreen({
  kind = "error",
  onRetry,
  homeHref = "/",
  variant = "page"
}: {
  kind?: "error" | "notFound";
  onRetry?: () => void;
  homeHref?: string;
  variant?: "page" | "section";
}) {
  const title = kind === "error" ? ERROR_SCREEN_COPY.errorTitle : ERROR_SCREEN_COPY.notFoundTitle;
  const body = kind === "error" ? ERROR_SCREEN_COPY.errorBody : ERROR_SCREEN_COPY.notFoundBody;
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-5",
        variant === "page" ? "bg-paper min-h-screen py-10" : "min-h-[60vh] py-8"
      )}
    >
      <div
        role={kind === "error" ? "alert" : undefined}
        data-testid={kind === "error" ? "error-screen" : "not-found-screen"}
        className="border-border w-full max-w-[420px] rounded-[20px] border bg-white px-9 pt-[34px] pb-7 text-center shadow-[var(--shadow-e3)] max-sm:rounded-2xl max-sm:px-[22px]"
      >
        <div className="mb-5 flex justify-center">
          <Iv1Mark className="h-[29px] w-auto" title="Ivano PMS" />
        </div>
        {kind === "notFound" ? (
          <p className="text-primary text-sm font-semibold tracking-wide">404</p>
        ) : null}
        <h1 className="font-display text-ink text-[26px] leading-8 font-medium max-sm:text-2xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-[22px]">{body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <button type="button" onClick={onRetry} className={primaryClass}>
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </button>
          ) : null}
          <Link href={homeHref} className={onRetry ? secondaryClass : primaryClass}>
            <Home className="size-4" aria-hidden />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
