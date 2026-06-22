"use client";

import { useQuery } from "convex/react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatMessageTimestamp } from "@/lib/format";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type BookingAuditTrailProps = {
  bookingId: Id<"booking">;
};

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function BookingAuditTrail({ bookingId }: BookingAuditTrailProps) {
  const auditTrail = useQuery(api.functions.bookings.getBookingAuditTrail, {
    bookingId
  });

  if (auditTrail === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (auditTrail.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No status history yet.</p>
    );
  }

  return (
    <ul className="divide-border divide-y text-sm">
      {auditTrail.map((entry) => {
        const newStatus =
          typeof entry.newValues === "object" &&
          entry.newValues !== null &&
          "status" in entry.newValues &&
          typeof entry.newValues.status === "string"
            ? entry.newValues.status
            : "updated";
        const reason =
          typeof entry.newValues === "object" &&
          entry.newValues !== null &&
          "reason" in entry.newValues &&
          typeof entry.newValues.reason === "string"
            ? entry.newValues.reason
            : null;

        return (
          <li key={entry._id} className="py-2">
            <p>
              <span className="font-medium">{entry.actorName ?? "Manager"}</span>{" "}
              changed status to{" "}
              <span className="font-medium capitalize">
                {formatStatusLabel(newStatus)}
              </span>{" "}
              on {formatMessageTimestamp(entry.createdAt)}
              {reason ? ` — ${reason}` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
