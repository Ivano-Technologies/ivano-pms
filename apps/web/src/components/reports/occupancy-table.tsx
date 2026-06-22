"use client";

import { cn } from "@/lib/utils";

type OccupancyRow = {
  unitId: string;
  unitNumber: string;
  unitType: string;
  occupiedNights: number;
  totalNights: number;
  occupancyRate: number;
};

type OccupancyTableProps = {
  rows: OccupancyRow[];
};

function rateColor(rate: number): string {
  if (rate >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300";
  if (rate >= 0.5) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

export function OccupancyTable({ rows }: OccupancyTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No units to display.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Unit</th>
            <th className="px-4 py-2 text-left font-medium">Type</th>
            <th className="px-4 py-2 text-right font-medium">Nights</th>
            <th className="px-4 py-2 text-right font-medium">Occupancy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = Math.round(row.occupancyRate * 100);
            return (
              <tr key={row.unitId} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{row.unitNumber}</td>
                <td className="text-muted-foreground px-4 py-2 capitalize">
                  {row.unitType}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.occupiedNights}/{row.totalNights}
                </td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      rateColor(row.occupancyRate)
                    )}
                  >
                    {pct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
