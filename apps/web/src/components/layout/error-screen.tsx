"use client";

import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { Iv1Mark } from "@/components/brand/iv1-mark";
import { ErrorRef } from "@/components/ui/error-ref";
import { generateErrorRef, refFromId, reportError, serverRefOf } from "@/lib/friendly-error";
import { cn } from "@/lib/utils";

export const ERROR_SCREEN_COPY = {
  errorTitle: "Something went wrong",
  errorBody: "We hit a problem loading this page.",
  notFoundTitle: "Page not found",
  notFoundBody: "The page you're looking for doesn't exist or has moved."
} as const;

/**
 * The support ref for an error page: the Convex server ref, else the Next.js digest (also in the
 * server logs), else a fresh one. Logged once with the raw error.
 */
export function useReportedErrorRef(error: Error & { digest?: string }, context: string): string {
  const ref = useMemo(
    () => serverRefOf(error) ?? refFromId(error.digest) ?? generateErrorRef(),
    [error]
  );
  useEffect(() => {
    reportError(error, context, ref);
  }, [error, context, ref]);
  return ref;
}

const focusClass =
  "focus-visible:outline-primary focus:outline-primary focus:outline-2 focus:outline-offset-2";

const primaryClass =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[46px] items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold shadow-[var(--shadow-e1)]";

/**
 * IVA-189: friendly full page or in shell message for error.tsx, global-error.tsx and
 * not-found.tsx. Never renders error.message, digests or stack traces.
 *
 * One action only: "Try again" for runtime errors, "Go home" for not found. Runtime errors also
 * show the muted support ref that was logged with the raw error.
 */
export function ErrorScreen({
  kind = "error",
  onRetry,
  homeHref = "/",
  variant = "page",
  errorRef
}: {
  kind?: "error" | "notFound";
  onRetry?: () => void;
  homeHref?: string;
  variant?: "page" | "section";
  errorRef?: string | null;
}) {
  const title = kind === "error" ? ERROR_SCREEN_COPY.errorTitle : ERROR_SCREEN_COPY.notFoundTitle;
  const body = kind === "error" ? ERROR_SCREEN_COPY.errorBody : ERROR_SCREEN_COPY.notFoundBody;
  // IVA-189: move focus to the one action as soon as the screen appears, so keyboard and screen
  // reader users land on "Try again" or "Go home" instead of the shell's first control.
  const actionRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  useEffect(() => {
    actionRef.current?.focus();
  }, [kind]);
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
          <p data-testid="not-found-code" className="text-muted-foreground text-sm font-semibold tracking-wide">
            404
          </p>
        ) : null}
        <h1 className="font-display text-ink text-[26px] leading-8 font-medium max-sm:text-2xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[15px] leading-[22px]">{body}</p>
        <div className="mt-6 flex justify-center">
          {kind === "error" && onRetry ? (
            <button
              ref={actionRef}
              type="button"
              onClick={onRetry}
              className={cn(primaryClass, focusClass, "max-sm:w-full")}
            >
              <RotateCcw className="size-4" aria-hidden />
              Try again
            </button>
          ) : (
            <Link ref={actionRef} href={homeHref} className={cn(primaryClass, focusClass, "max-sm:w-full")}>
              <Home className="size-4" aria-hidden />
              Go home
            </Link>
          )}
        </div>
        {kind === "error" ? <ErrorRef code={errorRef} className="mt-4" /> : null}
      </div>
    </div>
  );
}
