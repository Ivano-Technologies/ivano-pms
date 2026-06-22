"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AVAILABILITY_STATUS_META,
  formatNgn,
  type AvailabilityStatus
} from "@/lib/unit-utils";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../../../convex/_generated/dataModel";

type UnitCardProps = {
  unit: Doc<"unit">;
  onEdit: (unit: Doc<"unit">) => void;
  onStatusChange: (unitId: Doc<"unit">["_id"], status: AvailabilityStatus) => void;
};

const ALL_STATUSES: AvailabilityStatus[] = [
  "available",
  "occupied",
  "maintenance",
  "reserved"
];

export function UnitCard({ unit, onEdit, onStatusChange }: UnitCardProps) {
  const currentMeta = AVAILABILITY_STATUS_META[unit.availabilityStatus];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold leading-tight">{unit.unitNumber}</p>
            <p className="text-muted-foreground text-sm capitalize">{unit.unitType}</p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                currentMeta.badgeClass
              )}
            >
              {currentMeta.label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit unit ${unit.unitNumber}`}
              onClick={() => onEdit(unit)}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Capacity</dt>
            <dd>{unit.capacityGuests} guests</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Price / night</dt>
            <dd>{formatNgn(unit.pricePerNightNgn)}</dd>
          </div>
        </dl>

        {unit.amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {unit.amenities.map((a) => (
              <span
                key={a}
                className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
              >
                {a}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto">
          <p className="text-muted-foreground mb-1 text-xs font-medium">Status</p>
          <div className="flex flex-wrap gap-1">
            {ALL_STATUSES.map((status) => {
              const meta = AVAILABILITY_STATUS_META[status];
              const isActive = unit.availabilityStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    if (!isActive) onStatusChange(unit._id, status);
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity",
                    isActive
                      ? cn(meta.badgeClass, "ring-1 ring-current")
                      : "border-border text-muted-foreground hover:bg-muted opacity-60"
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
