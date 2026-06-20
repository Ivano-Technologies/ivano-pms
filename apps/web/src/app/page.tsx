import Link from "next/link";

import { PoweredByTechivano } from "@/components/brand/powered-by-techivano";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="text-foreground flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{BRAND_NAME}</h1>
        <p className="text-muted-foreground text-lg">{BRAND_TAGLINE}</p>
        <p className="text-muted-foreground text-sm">
          Manage bookings, guests, units, and channel messages for your property.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
      <footer className="text-muted-foreground absolute bottom-6 text-xs">
        <PoweredByTechivano />
      </footer>
    </main>
  );
}
