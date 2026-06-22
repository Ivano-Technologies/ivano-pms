"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useMutation } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  AMENITY_OPTIONS,
  emptyUnitForm,
  inputClassName,
  toUnitMutationArgs,
  type UnitFormErrors,
  type UnitFormValues,
  unitFormFromDoc,
  UNIT_TYPE_OPTIONS,
  validateUnitForm
} from "@/lib/unit-utils";

type UnitFormModalProps =
  | { mode: "create"; isOpen: boolean; onClose: () => void; unit?: undefined }
  | {
      mode: "edit";
      isOpen: boolean;
      unit: Doc<"unit">;
      onClose: () => void;
    };

export function UnitFormModal({ mode, isOpen, unit, onClose }: UnitFormModalProps) {
  const createUnit = useMutation(api.functions.units.createUnit);
  const updateUnit = useMutation(api.functions.units.updateUnit);

  const [values, setValues] = useState<UnitFormValues>(emptyUnitForm);
  const [errors, setErrors] = useState<UnitFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(mode === "edit" && unit ? unitFormFromDoc(unit) : emptyUnitForm());
      setErrors({});
    }
  }, [isOpen, mode, unit]);

  if (!isOpen) return null;

  function handleChange<K extends keyof UnitFormValues>(
    field: K,
    value: UnitFormValues[K]
  ) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function toggleAmenity(amenity: string) {
    setValues((v) => ({
      ...v,
      amenities: v.amenities.includes(amenity)
        ? v.amenities.filter((a) => a !== amenity)
        : [...v.amenities, amenity]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateUnitForm(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const args = toUnitMutationArgs(values);
      if (mode === "edit" && unit) {
        await updateUnit({ unitId: unit._id, ...args });
        toast.success("Unit updated");
      } else {
        await createUnit(args);
        toast.success("Unit created");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-background relative z-10 w-full max-w-lg rounded-xl p-6 shadow-xl">
        <h2 id="unit-modal-title" className="mb-4 text-lg font-semibold">
          {mode === "create" ? "Add unit" : "Edit unit"}
        </h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="unitNumber" className="mb-1 block text-sm font-medium">
                Unit number <span aria-hidden="true">*</span>
              </label>
              <input
                id="unitNumber"
                type="text"
                required
                maxLength={50}
                className={inputClassName}
                value={values.unitNumber}
                onChange={(e) => handleChange("unitNumber", e.target.value)}
                aria-invalid={!!errors.unitNumber}
                aria-describedby={errors.unitNumber ? "unitNumber-err" : undefined}
              />
              {errors.unitNumber ? (
                <p id="unitNumber-err" className="mt-0.5 text-xs text-red-600" role="alert">
                  {errors.unitNumber}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="unitType" className="mb-1 block text-sm font-medium">
                Type <span aria-hidden="true">*</span>
              </label>
              <select
                id="unitType"
                className={inputClassName}
                value={values.unitType}
                onChange={(e) =>
                  handleChange("unitType", e.target.value as UnitFormValues["unitType"])
                }
              >
                {UNIT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="capacityGuests" className="mb-1 block text-sm font-medium">
                Capacity (guests) <span aria-hidden="true">*</span>
              </label>
              <input
                id="capacityGuests"
                type="number"
                min={1}
                max={20}
                className={inputClassName}
                value={values.capacityGuests}
                onChange={(e) =>
                  handleChange("capacityGuests", parseInt(e.target.value, 10) || 1)
                }
                aria-invalid={!!errors.capacityGuests}
              />
              {errors.capacityGuests ? (
                <p className="mt-0.5 text-xs text-red-600" role="alert">
                  {errors.capacityGuests}
                </p>
              ) : null}
            </div>

            <div className="col-span-2">
              <label htmlFor="pricePerNightNgn" className="mb-1 block text-sm font-medium">
                Price per night (NGN) <span aria-hidden="true">*</span>
              </label>
              <input
                id="pricePerNightNgn"
                type="number"
                min={0}
                step={500}
                className={inputClassName}
                value={values.pricePerNightNgn}
                onChange={(e) =>
                  handleChange("pricePerNightNgn", parseInt(e.target.value, 10) || 0)
                }
                aria-invalid={!!errors.pricePerNightNgn}
              />
              {errors.pricePerNightNgn ? (
                <p className="mt-0.5 text-xs text-red-600" role="alert">
                  {errors.pricePerNightNgn}
                </p>
              ) : null}
            </div>
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">Amenities</legend>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const checked = values.amenities.includes(amenity);
                return (
                  <label key={amenity} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !values.unitNumber.trim()}
              aria-busy={saving}
            >
              {saving ? "Saving…" : mode === "create" ? "Create unit" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
