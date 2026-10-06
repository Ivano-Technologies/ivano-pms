"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { lobbyButton } from "./lobby-button";

/** "Sign in" for visitors; "Open dashboard" when a signed in user lands on the public page. */
export function AuthCta({
  className,
  withArrow = true
}: {
  className?: string;
  withArrow?: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded && isSignedIn;
  return (
    <Link href={signedIn ? "/dashboard" : "/sign-in"} className={lobbyButton("primary", className)}>
      {signedIn ? "Open dashboard" : "Sign in"}
      {withArrow ? <ArrowRight className="size-[18px]" aria-hidden /> : null}
    </Link>
  );
}
