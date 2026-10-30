import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Ivano PMS, operated by Ivano Technologies Ltd.",
  alternates: { canonical: "/terms" }
};

const CONTACT_EMAIL = "hi@ivanotechnologies.com";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-ink text-[22px] leading-7 font-medium">{title}</h2>
      <div className="text-muted-foreground mt-2 space-y-3 text-[15px] leading-[24px]">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-paper text-ink flex min-h-screen flex-col overflow-x-clip">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-10">
        <nav
          className="flex h-[62px] items-center justify-between sm:h-[76px]"
          aria-label="Main"
        >
          <Link href="/" aria-label="Ivano PMS home" className="rounded-md">
            <IvanoPmsLockup title={null} className="h-[34px] sm:h-10" />
          </Link>
          <Link
            href="/"
            className="text-ink inline-flex items-center gap-2 rounded-md text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </nav>

        <main className="mx-auto max-w-[720px] pt-6 pb-16 sm:pt-10">
          <h1 className="font-display text-ink text-[34px] leading-10 font-medium sm:text-[42px] sm:leading-[48px]">
            Terms of use
          </h1>
          <p className="text-muted-foreground mt-3 text-[15px] leading-[24px]">
            These terms cover your use of Ivano PMS, a property management app for hotels,
            serviced apartments and short lets. Ivano PMS is operated by Ivano Technologies Ltd, a
            company registered in Nigeria under RC 9326735 (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By
            creating an account or using the app you agree to these terms.
          </p>

          <Section title="1. Eligibility">
            <p>
              You must be 18 or older to sign up or use Ivano PMS. If you use the app for a
              business, you confirm you are allowed to accept these terms for that business.
            </p>
          </Section>

          <Section title="2. Your account">
            <p>
              Keep your sign in details safe and the information in your account accurate. You are
              responsible for activity under your account and for the people you give access to.
              Tell us promptly if you think your account has been misused.
            </p>
          </Section>

          <Section title="3. Acceptable use">
            <p>
              Use Ivano PMS only for lawful property and guest management. Do not misuse the app,
              try to access data that is not yours, interfere with its security or operation, send
              spam or unlawful messages to guests, or upload content you have no right to use.
            </p>
            <p>We may suspend or close accounts that break these terms.</p>
          </Section>

          <Section title="4. Fees">
            <p>
              Fees, if any, are as agreed with you in writing or shown to you before you subscribe.
              Unless agreed otherwise, fees are not refundable once a billing period has started.
            </p>
          </Section>

          <Section title="5. Your data">
            <p>
              You keep ownership of the property and guest data you put into Ivano PMS. We handle
              it only to provide and improve the service, in line with applicable Nigerian data
              protection law. You are responsible for having a lawful basis
              to share your guests&rsquo; data with us.
            </p>
          </Section>

          <Section title="6. Service and changes">
            <p>
              We work to keep Ivano PMS available and secure, but the service is provided as is and
              may change, pause or have interruptions from time to time. We may update these terms
              and will show the updated version on this page.
            </p>
          </Section>

          <Section title="7. Limitation of liability">
            <p>
              To the extent the law allows, we are not liable for indirect or consequential losses,
              such as lost profits, lost bookings or lost data. Our total liability for any claim
              is limited to the fees you paid us for Ivano PMS in the 12 months before the claim.
              Nothing in these terms limits liability that cannot be limited by law.
            </p>
          </Section>

          <Section title="8. Governing law">
            <p>
              These terms are governed by the laws of the Federal Republic of Nigeria, and the
              courts of Nigeria have jurisdiction over any dispute about them.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions about these terms? Email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary font-semibold underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </main>
      </div>
      <LandingFooter />
    </div>
  );
}
