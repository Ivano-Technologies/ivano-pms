"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { Id } from "../../../../../convex/_generated/dataModel";

const BookingChecklist = dynamic(
  () =>
    import("@/components/bookings/booking-checklist").then((m) => ({
      default: m.BookingChecklist
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-20 w-full" />
  }
);

type ChecklistSlideOverProps = {
  bookingId: Id<"booking">;
  guestName: string;
  open: boolean;
  onClose: () => void;
  className?: string;
};

export function ChecklistSlideOver({
  bookingId,
  guestName,
  open,
  onClose,
  className
}: ChecklistSlideOverProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn("fixed inset-0 z-[60] flex justify-end", className)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close checklist overlay"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Checklist for ${guestName}`}
        className="border-border bg-card relative flex h-full w-full max-w-md flex-col border-l shadow-xl"
      >
        <div className="border-border flex min-h-11 items-center justify-between gap-2 border-b px-4 py-2">
          <h3 className="truncate text-sm font-semibold">Checklist · {guestName}</h3>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex size-11 items-center justify-center"
            aria-label="Close checklist"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <BookingChecklist bookingId={bookingId} />
        </div>
      </div>
    </div>
  );
}
