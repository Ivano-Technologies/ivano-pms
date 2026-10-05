"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useMemo } from "react";

import StatsCards from "@/components/dashboard/stats-cards";
import PendingMessagesList from "@/components/dashboard/pending-messages-list";
import { usePropertyScope } from "@/components/layout/property-context";
import { Skeleton } from "@/components/ui/skeleton";
import { countActiveBookings, formatMessageExtractionBadge } from "@/lib/format";

import { api } from "../../../../../convex/_generated/api";

/** Target: dashboard interactive in under 2s on localhost with seed data. */
function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function DashboardOverview() {
  const { isLoaded: isUserLoaded } = useUser();
  const today = useMemo(() => todayIsoDate(), []);
  const { propertyArgs } = usePropertyScope();

  const manager = useQuery(api.functions.managers.getCurrentManagerProfile);
  const canQuery = isUserLoaded && manager !== undefined && manager !== null;

  const dashboardStats = useQuery(
    api.functions.dashboard.getDashboardStats,
    canQuery ? { today, ...propertyArgs } : "skip"
  );

  const channelMessages = useQuery(
    api.functions.channelMessages.getChannelMessages,
    canQuery ? { status: "new" as const, limit: 5, ...propertyArgs } : "skip"
  );

  const property = useQuery(
    api.functions.property.getProperty,
    canQuery ? { ...propertyArgs } : "skip"
  );

  const statsLoading =
    !isUserLoaded || manager === undefined || (canQuery && dashboardStats === undefined);

  const messagesLoading =
    !isUserLoaded || manager === undefined || (canQuery && channelMessages === undefined);

  const statsView =
    dashboardStats === undefined || dashboardStats === null
      ? null
      : {
          occupancyRate: dashboardStats.occupancyRate,
          revenue: dashboardStats.revenueNgn,
          pendingMessages: dashboardStats.pendingMessageCount,
          activeBookings: countActiveBookings(dashboardStats.bookingCountByStatus)
        };

  const messageViews =
    channelMessages?.map((message) => ({
      id: message._id,
      channel: message.channel,
      sender: message.senderName,
      text: message.messageText,
      timestamp: message.createdAt,
      status: message.status,
      extractionBadge: formatMessageExtractionBadge(message)
    })) ?? [];

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

      <section aria-label="Pending messages">
        <PendingMessagesList
          messages={messageViews}
          totalUnread={dashboardStats?.pendingMessageCount ?? 0}
          isLoading={messagesLoading || managerMissing}
          error={managerMissing ? new Error("Manager not found") : null}
        />
      </section>
    </div>
  );
}
