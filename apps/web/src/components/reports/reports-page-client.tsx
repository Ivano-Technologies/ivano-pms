"use client";

import { useMemo } from "react";

import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import { usePropertyScope } from "@/components/layout/property-context";
import { OccupancyTable } from "./occupancy-table";
import { RevenueChart } from "./revenue-chart";

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

export function ReportsPageClient() {
  const range = useMemo(() => defaultDateRange(), []);
  const { propertyArgs } = usePropertyScope();

  const revenue = useQuery(api.functions.reports.getRevenueByMonth, {
    months: 6,
    ...propertyArgs
  });
  const occupancy = useQuery(api.functions.reports.getOccupancyByUnit, {
    ...range,
    ...propertyArgs
  });

  const loading = revenue === undefined || occupancy === undefined;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Revenue and occupancy for the last 6 months and 30 days.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revenue by month</h2>
        {loading ? (
          <div className="bg-muted h-52 animate-pulse rounded-xl" />
        ) : (
          <RevenueChart data={revenue} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Occupancy by unit ({range.startDate} – {range.endDate})
        </h2>
        {loading ? (
          <div className="bg-muted h-40 animate-pulse rounded-xl" />
        ) : (
          <OccupancyTable rows={occupancy} />
        )}
      </section>
    </div>
  );
}
