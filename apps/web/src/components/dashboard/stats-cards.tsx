import {
  BedDouble,
  CalendarCheck,
  MessageSquareWarning,
  Wallet
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNgn, formatOccupancyRate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DashboardStatsView = {
  occupancyRate: number;
  revenue: number;
  pendingMessages: number;
  activeBookings: number;
};

type StatsCardsProps = {
  stats?: DashboardStatsView | null;
  isLoading: boolean;
  error?: Error | null;
};

const CARDS = [
  {
    key: "occupancy",
    label: "Occupancy today",
    icon: BedDouble,
    accent: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
  },
  {
    key: "revenue",
    label: "Revenue today",
    icon: Wallet,
    accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
  },
  {
    key: "pending",
    label: "Pending messages",
    icon: MessageSquareWarning,
    accent: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
  },
  {
    key: "active",
    label: "Active bookings",
    icon: CalendarCheck,
    accent: "text-slate-600 bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200"
  }
] as const;

function StatValue({
  cardKey,
  stats
}: {
  cardKey: (typeof CARDS)[number]["key"];
  stats: DashboardStatsView;
}) {
  switch (cardKey) {
    case "occupancy":
      return formatOccupancyRate(stats.occupancyRate);
    case "revenue":
      return formatNgn(stats.revenue);
    case "pending":
      return stats.pendingMessages.toLocaleString("en-NG");
    case "active":
      return stats.activeBookings.toLocaleString("en-NG");
  }
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <Card key={card.key}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function StatsCards({
  stats,
  isLoading,
  error
}: StatsCardsProps) {
  if (isLoading) {
    return <StatsCardsSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="border-border text-muted-foreground rounded-xl border bg-muted/30 px-4 py-8 text-center text-sm">
        Unable to load stats
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardDescription>{card.label}</CardDescription>
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                    card.accent
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                <StatValue cardKey={card.key} stats={stats} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-xs">
                {card.key === "occupancy" && "Units occupied today"}
                {card.key === "revenue" && "Recognized from active stays"}
                {card.key === "pending" && "Channel messages awaiting review"}
                {card.key === "active" && "Inquiry through checked-in"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
