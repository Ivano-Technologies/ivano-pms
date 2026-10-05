import { Suspense } from "react";

import { SettingsPageClient } from "@/components/settings/settings-page-client";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="bg-muted h-40 animate-pulse rounded-xl" />}>
      <SettingsPageClient />
    </Suspense>
  );
}
