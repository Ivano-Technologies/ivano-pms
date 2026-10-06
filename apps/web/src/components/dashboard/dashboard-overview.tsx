"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useMemo } from "react";

import StatsCards from "@/components/dashboard/stats-cards";
import { usePropertyScope } from "@/components/layout/property-context";
import { Skeleton } from "@/components/ui/skeleton";
import { countActiveBookings } from "@/lib/format";

import { api } from "../../../../../convex/_generated/api";

/** Target: dashboard interactive in under 2s on localhost with seed data. */
function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function DashboardOverview() {
  const { isLoading: isAuthLoading } = useConvexAuth();
  const isUserLoaded = !isAuthLoading;
  const today = useMemo(() => todayIsoDate(), []);
  const { propertyArgs } = usePropertyScope();

  const manager = useQuery(api.functions.managers.getCurrentManagerProfile);
  const canQuery = isUserLoaded && manager !== undefined && manager !== null;

  const dashboardStats = useQuery(
    api.functions.dashboard.getDashboardStats,
    canQuery ? { today, ...propertyArgs } : "skip"
  );

  const property = useQuery(
    api.functions.property.getProperty,
    canQuery ? { ...propertyArgs } : "skip"
  );

  const statsLoading =
    !isUserLoaded || manager === undefined || (canQuery && dashboardStats === undefined);

  const statsView =
    dashboardStats === undefined || dashboardStats === null
      ? null
      : {
          occupancyRate: dashboardStats.occupancyRate,
          revenue: dashboardStats.revenueNgn,
          pendingMessages: dashboardStats.pendingMessageCount,
          activeBookings: countActiveBookings(dashboardStats.bookingCountByStatus)
        };

  const managerMissing = isUserLoaded && manager === null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Property dashboard</h1>
        {property === undefined ? (
          <Skeleton className="mt-2 h-4 w-48" />
        ) : property ? (
          <p className="text-muted-foreground mt-1 text-sm">{property.name}</p>
        ) : null}
        {managerMissing ? (
          <p className="text-destructive mt-2 text-sm">
            Manager profile not found. Refresh after signing in, or run seed and try again.
          </p>
        ) : null}
      </div>

      <section aria-label="Dashboard statistics">
        <StatsCards
          stats={statsView}
          isLoading={statsLoading || managerMissing}
          error={managerMissing ? new Error("Manager not found") : null}
        />
      </section>
    </div>
  );
}
