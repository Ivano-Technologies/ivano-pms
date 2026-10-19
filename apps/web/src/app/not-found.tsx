import type { Metadata } from "next";

import { ErrorScreen } from "@/components/layout/error-screen";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false }
};

/** IVA-189: friendly 404 with a way home. */
export default function NotFound() {
  return <ErrorScreen kind="notFound" homeHref="/" />;
}
