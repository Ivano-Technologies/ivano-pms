"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  emptyGuestForm,
  guestFormFromDoc,
  ID_TYPE_OPTIONS,
  inputClassName,
  toGuestMutationArgs,
  validateGuestForm,
  type GuestFormValues
} from "@/lib/guest-utils";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";

type GuestFormModalProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  guest?: Doc<"guest"> | null;
  onClose: () => void;
};

export function GuestFormModal({
  mode,
  isOpen,
  guest,
  onClose
}: GuestFormModalProps) {
  const createGuest = useMutation(api.functions.guests.createGuest);
  const updateGuest = useMutation(api.functions.guests.updateGuest);

  const [values, setValues] = useState<GuestFormValues>(emptyGuestForm());
  const [errors, setErrors] = useState<ReturnType<typeof validateGuestForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setValues(guest ? guestFormFromDoc(guest) : emptyGuestForm());
    setErrors({});
  }, [isOpen, guest]);

  if (!isOpen) {
    return null;
  }

  const title = mode === "create" ? "Add guest" : "Edit guest";
  const canSubmit =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    !isSubmitting;

  function updateField<K extends keyof GuestFormValues>(
    key: K,
    value: GuestFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validateField(key: keyof GuestFormValues) {
    const nextErrors = validateGuestForm(values);
    setErrors((prev) => ({ ...prev, [key]: nextErrors[key] }));
  }

  async function handleSubmit() {
    const nextErrors = validateGuestForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const args = toGuestMutationArgs(values);
      if (mode === "create") {
        await createGuest(args);
        toast.success("Guest created");
      } else if (guest) {
        await updateGuest({
          guestId: guest._id,
          ...args
        });
        toast.success("Guest updated");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save guest");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-form-title"
      onClick={onClose}
    >
      <div
        className="bg-background border-border max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="guest-form-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-1">
            <span className="text-sm font-medium">First name *</span>
            <input
              className={inputClassName}
              value={values.firstName}
              maxLength={100}
              onChange={(e) => updateField("firstName", e.target.value)}
              onBlur={() => validateField("firstName")}
            />
            {errors.firstName ? (
              <p className="text-destructive text-xs">{errors.firstName}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5 sm:col-span-1">
            <span className="text-sm font-medium">Last name *</span>
            <input
              className={inputClassName}
              value={values.lastName}
              maxLength={100}
              onChange={(e) => updateField("lastName", e.target.value)}
              onBlur={() => validateField("lastName")}
            />
            {errors.lastName ? (
              <p className="text-destructive text-xs">{errors.lastName}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Phone *</span>
            <input
              className={inputClassName}
              type="tel"
              value={values.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={() => validateField("phone")}
            />
            {errors.phone ? (
              <p className="text-destructive text-xs">{errors.phone}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className={inputClassName}
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={() => validateField("email")}
            />
            {errors.email ? (
              <p className="text-destructive text-xs">{errors.email}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">WhatsApp</span>
            <input
              className={inputClassName}
              type="tel"
              value={values.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-1">
            <span className="text-sm font-medium">ID type *</span>
            <select
              className={inputClassName}
              value={values.idType}
              onChange={(e) =>
                updateField("idType", e.target.value as GuestFormValues["idType"])
              }
            >
              {ID_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 sm:col-span-1">
            <span className="text-sm font-medium">ID number *</span>
            <input
              className={inputClassName}
              value={values.idNumber}
              onChange={(e) => updateField("idNumber", e.target.value)}
              onBlur={() => validateField("idNumber")}
            />
            {errors.idNumber ? (
              <p className="text-destructive text-xs">{errors.idNumber}</p>
            ) : null}
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              className={`${inputClassName} min-h-[80px] resize-y`}
              value={values.notes}
              maxLength={500}
              rows={3}
              onChange={(e) => updateField("notes", e.target.value)}
              onBlur={() => validateField("notes")}
              placeholder="Optional guest notes"
            />
            {errors.notes ? (
              <p className="text-destructive text-xs">{errors.notes}</p>
            ) : null}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting
              ? "Saving…"
              : mode === "create"
                ? "Create guest"
                : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
