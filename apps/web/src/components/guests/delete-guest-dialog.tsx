"use client";

import { Button } from "@/components/ui/button";

type DeleteGuestDialogProps = {
  guestName: string;
  activeBookingCount: number;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteGuestDialog({
  guestName,
  activeBookingCount,
  isOpen,
  isDeleting,
  onClose,
  onConfirm
}: DeleteGuestDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-guest-title"
      aria-describedby="delete-guest-desc"
      onClick={onClose}
    >
      <div
        className="bg-background border-border w-full max-w-md rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-guest-title" className="text-lg font-semibold">
          Delete {guestName}?
        </h2>
        <p id="delete-guest-desc" className="text-muted-foreground mt-2 text-sm">
          This soft-deletes the guest record. You can undo within 30 seconds.
        </p>
        {activeBookingCount > 0 ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Warning: this guest has {activeBookingCount} active booking
            {activeBookingCount === 1 ? "" : "s"}. Existing bookings are kept.
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete guest"}
          </Button>
        </div>
      </div>
    </div>
  );
}
