"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Iv1Mark } from "@/components/brand/iv1-mark";
import { cn } from "@/lib/utils";

type AuthMode = "signIn" | "signUp";
type Step = "start" | "otp";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden
      className={className}
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function AuthCard({ mode }: { mode: AuthMode }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signUp";
  const title = isSignUp ? "Create your Ivano PMS account" : "Sign in to Ivano PMS";
  const subtitle = isSignUp
    ? "Open your front desk with Google or your work email."
    : "Welcome back. Sign in to open your front desk.";
  const altHref = isSignUp ? "/sign-in" : "/sign-up";
  const altLead = isSignUp ? "Already have an account?" : "New here?";
  const altLabel = isSignUp ? "Sign in" : "Create an account";

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign in failed");
      setBusy(false);
    }
  }

  async function sendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("email", trimmed);
      await signIn("resend-otp", formData);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("code", code.trim());
      await signIn("resend-otp", formData);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center">
      <div
        className="border-border w-full overflow-hidden rounded-[20px] border bg-white shadow-[var(--shadow-e3)] max-sm:rounded-2xl"
        role="region"
        aria-label={isSignUp ? "Create account" : "Sign in"}
      >
        <div className="px-9 pt-[34px] pb-7 max-sm:px-[22px] max-sm:pt-[26px] max-sm:pb-[22px]">
          <div className="mb-5 flex justify-center">
            <Iv1Mark className="h-[29px] w-auto" />
          </div>
          <h1 className="font-display text-ink text-center text-[26px] leading-8 font-medium max-sm:text-2xl max-sm:leading-[30px]">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-center text-[15px] leading-[22px]">
            {subtitle}
          </p>

          {step === "start" ? (
            <>
              <button
                type="button"
                onClick={() => void continueWithGoogle()}
                disabled={busy}
                className="border-line2 text-ink mt-6 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-lg border bg-white text-[15px] font-semibold disabled:opacity-60"
              >
                <GoogleGlyph />
                Continue with Google
              </button>

              <div className="text-muted-foreground my-5 flex items-center gap-3 text-[13px] font-medium">
                <span className="bg-border h-px flex-1" />
                or
                <span className="bg-border h-px flex-1" />
              </div>

              <form onSubmit={(e) => void sendOtp(e)}>
                <label
                  htmlFor="auth-email"
                  className="text-ink mb-1.5 block text-sm font-semibold"
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@yourproperty.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-grey4 text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-primary h-[46px] w-full rounded-lg border bg-white px-3.5 text-[15px] focus:outline-2 focus:outline-offset-2"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-primary hover:bg-[#9A3B27] mt-[18px] flex h-[46px] w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white shadow-[var(--shadow-e1)] disabled:opacity-60"
                >
                  Continue
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={(e) => void verifyOtp(e)} className="mt-6">
              <p className="text-muted-foreground mb-4 text-center text-sm">
                We sent an 8 digit code to <span className="text-ink font-semibold">{email}</span>
              </p>
              <label
                htmlFor="auth-code"
                className="text-ink mb-1.5 block text-sm font-semibold"
              >
                Sign in code
              </label>
              <input
                id="auth-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="12345678"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border-grey4 text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-primary h-[46px] w-full rounded-lg border bg-white px-3.5 text-[15px] tracking-widest focus:outline-2 focus:outline-offset-2"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-primary hover:bg-[#9A3B27] mt-[18px] flex h-[46px] w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white shadow-[var(--shadow-e1)] disabled:opacity-60"
              >
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="text-muted-foreground mt-3 w-full text-center text-sm font-medium"
                onClick={() => {
                  setStep("start");
                  setCode("");
                  setError(null);
                }}
              >
                Use a different email
              </button>
            </form>
          )}

          {error ? (
            <p className="text-destructive mt-3 text-center text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <p className={cn("text-muted-foreground mt-[18px] text-center text-sm font-medium")}>
        {altLead}{" "}
        <Link href={altHref} className="text-primary font-semibold no-underline">
          {altLabel}
        </Link>
      </p>
    </div>
  );
}
