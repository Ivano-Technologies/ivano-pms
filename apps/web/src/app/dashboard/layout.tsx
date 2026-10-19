import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PmsDashboardLayout } from "@/components/layout/pms-dashboard-layout";
import { DashboardAccessGate } from "@/components/dashboard/dashboard-access-gate";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  if (!(await isAuthenticatedNextjs())) {
    redirect("/sign-in");
  }

  return (
    <DashboardAccessGate>
      <PmsDashboardLayout>{children}</PmsDashboardLayout>
    </DashboardAccessGate>
  );
}
