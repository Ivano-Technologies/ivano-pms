import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND_DESCRIPTION, BRAND_HEADLINE, BRAND_NAME } from "@/lib/brand";

import "./globals.css";

/** Display face: headings, numbers in the hero, card titles. */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap"
});

/** UI and body face. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      .trim()
      .replace(/^["']|["']$/g, "")
  ),
  title: {
    default: `${BRAND_NAME} · ${BRAND_HEADLINE}`,
    template: `%s | ${BRAND_NAME}`
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/iv1-mark.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: `${BRAND_NAME} · ${BRAND_HEADLINE}`,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} · ${BRAND_HEADLINE}`,
    description: BRAND_DESCRIPTION
  }
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`light ${fraunces.variable} ${jakarta.variable} h-full antialiased`}
      >
        <body className="bg-background font-sans flex min-h-full flex-col">
          <ThemeProvider>
            <ConvexClientProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster richColors position="top-right" closeButton />
              </TooltipProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
