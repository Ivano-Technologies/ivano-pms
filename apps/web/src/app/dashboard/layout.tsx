import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PmsDashboardLayout } from "@/components/layout/pms-dashboard-layout";
import { DashboardManagerSync } from "@/components/dashboard/dashboard-manager-sync";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <PmsDashboardLayout>
      <DashboardManagerSync />
      {children}
    </PmsDashboardLayout>
  );
}
