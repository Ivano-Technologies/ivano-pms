"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteGuestDialog } from "@/components/guests/delete-guest-dialog";
import { GuestFormModal } from "@/components/guests/guest-form-modal";
import { GuestsTable } from "@/components/guests/guests-table";
import { Button } from "@/components/ui/button";
import {
  filterGuests,
  formatGuestName,
  inputClassName,
  sortGuests,
  type GuestSortKey
} from "@/lib/guest-utils";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";

export function GuestsPageClient() {
  const guests = useQuery(api.functions.guests.getGuests);
  const softDeleteGuest = useMutation(api.functions.guests.softDeleteGuest);
  const restoreGuest = useMutation(api.functions.guests.restoreGuest);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<GuestSortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingGuest, setEditingGuest] = useState<Doc<"guest"> | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Doc<"guest"> | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const deletingGuestDetails = useQuery(
    api.functions.guests.getGuestById,
    deletingGuest ? { guestId: deletingGuest._id } : "skip"
  );

  const displayedGuests = useMemo(() => {
    if (!guests) {
      return [];
    }
    const filtered = filterGuests(guests, search);
    return sortGuests(filtered, sortKey, sortAsc);
  }, [guests, search, sortKey, sortAsc]);

  function handleSort(key: GuestSortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function openCreate() {
    setEditingGuest(null);
    setFormMode("create");
  }

  function openEdit(guest: Doc<"guest">) {
    setEditingGuest(guest);
    setFormMode("edit");
  }

  function openDelete(guest: Doc<"guest">) {
    setDeletingGuest(guest);
  }

  async function handleDeleteConfirm() {
    if (!deletingGuest) {
      return;
    }

    const guestId = deletingGuest._id;
    const guestName = formatGuestName(deletingGuest);

    setIsDeleting(true);
    try {
      await softDeleteGuest({ guestId });
      setDeletingGuest(null);
      toast.success(`${guestName} deleted`, {
        duration: 30_000,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreGuest({ guestId })
              .then(() => toast.success(`${guestName} restored`))
              .catch((error) =>
                toast.error(
                  error instanceof Error ? error.message : "Restore failed"
                )
              );
          }
        }
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete guest"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Guests</h1>
          <p className="text-muted-foreground text-sm">
            Manage guest profiles for bookings and channel conversions.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          Add guest
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search guests</span>
          <input
            type="search"
            placeholder="Search by name, email, or phone…"
            className={inputClassName}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {guests ? (
          <p className="text-muted-foreground shrink-0 text-sm">
            {displayedGuests.length} of {guests.length} guests
          </p>
        ) : null}
      </div>

      <GuestsTable
        guests={displayedGuests}
        isLoading={guests === undefined}
        sortKey={sortKey}
        sortAsc={sortAsc}
        onSort={handleSort}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <GuestFormModal
        mode={formMode === "edit" ? "edit" : "create"}
        isOpen={formMode !== null}
        guest={editingGuest}
        onClose={() => {
          setFormMode(null);
          setEditingGuest(null);
        }}
      />

      <DeleteGuestDialog
        guestName={deletingGuest ? formatGuestName(deletingGuest) : ""}
        activeBookingCount={deletingGuestDetails?.activeBookingCount ?? 0}
        isOpen={deletingGuest !== null}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeletingGuest(null);
          }
        }}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
}
