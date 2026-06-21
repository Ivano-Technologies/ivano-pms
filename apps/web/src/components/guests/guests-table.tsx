"use client";

import Link from "next/link";
import { Pencil, Trash2, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  formatGuestName,
  formatIdType,
  type GuestSortKey
} from "@/lib/guest-utils";
import { formatMessageTimestamp } from "@/lib/format";

import type { Doc } from "../../../../../convex/_generated/dataModel";

type GuestsTableProps = {
  guests: Doc<"guest">[];
  isLoading: boolean;
  sortKey: GuestSortKey;
  sortAsc: boolean;
  onSort: (key: GuestSortKey) => void;
  onEdit: (guest: Doc<"guest">) => void;
  onDelete: (guest: Doc<"guest">) => void;
};

function SortButton({
  label,
  active,
  ascending,
  onClick
}: {
  label: string;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="hover:text-foreground inline-flex items-center gap-1 font-medium"
      onClick={onClick}
    >
      {label}
      {active ? <span aria-hidden>{ascending ? "↑" : "↓"}</span> : null}
    </button>
  );
}

function GuestsTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function GuestsTable({
  guests,
  isLoading,
  sortKey,
  sortAsc,
  onSort,
  onEdit,
  onDelete
}: GuestsTableProps) {
  if (isLoading) {
    return <GuestsTableSkeleton />;
  }

  if (guests.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No guests yet. Create one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortButton
              label="Name"
              active={sortKey === "name"}
              ascending={sortAsc}
              onClick={() => onSort("name")}
            />
          </TableHead>
          <TableHead>
            <SortButton
              label="Email"
              active={sortKey === "email"}
              ascending={sortAsc}
              onClick={() => onSort("email")}
            />
          </TableHead>
          <TableHead>
            <SortButton
              label="Phone"
              active={sortKey === "phone"}
              ascending={sortAsc}
              onClick={() => onSort("phone")}
            />
          </TableHead>
          <TableHead>ID</TableHead>
          <TableHead>
            <SortButton
              label="Added"
              active={sortKey === "createdAt"}
              ascending={sortAsc}
              onClick={() => onSort("createdAt")}
            />
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guests.map((guest) => (
          <TableRow key={guest._id}>
            <TableCell className="font-medium">
              {formatGuestName(guest)}
            </TableCell>
            <TableCell>{guest.email ?? "—"}</TableCell>
            <TableCell>{guest.phone}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatIdType(guest.idType)} · {guest.idNumber}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatMessageTimestamp(guest.createdAt)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${formatGuestName(guest)}`}
                  onClick={() => onEdit(guest)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${formatGuestName(guest)}`}
                  onClick={() => onDelete(guest)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/bookings"
                    aria-label={`View bookings for ${formatGuestName(guest)}`}
                  >
                    <CalendarDays className="size-4" />
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
