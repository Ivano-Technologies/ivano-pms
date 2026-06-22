"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { type AvailabilityStatus } from "@/lib/unit-utils";
import { UnitCard } from "./unit-card";
import { UnitFormModal } from "./unit-form-modal";

export function UnitsGrid() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Doc<"unit"> | null>(null);

  const units = useQuery(api.functions.units.getUnits, {
    includeMaintenanceReserved: includeInactive
  });

  const setUnitAvailability = useMutation(api.functions.units.setUnitAvailability);

  function openCreate() {
    setEditingUnit(null);
    setModalOpen(true);
  }

  function openEdit(unit: Doc<"unit">) {
    setEditingUnit(unit);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUnit(null);
  }

  async function handleStatusChange(
    unitId: Id<"unit">,
    status: AvailabilityStatus
  ) {
    try {
      await setUnitAvailability({ unitId, availabilityStatus: status });
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const isLoading = units === undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          Show maintenance / reserved
        </label>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Add unit
        </Button>
      </div>

      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading units"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-52 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : units.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-base font-medium">No units yet</p>
          <p className="text-sm">
            Create your first unit to start managing availability.
          </p>
          <Button type="button" onClick={openCreate} className="mt-2 gap-2">
            <Plus className="size-4" />
            Add unit
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <UnitCard
              key={unit._id}
              unit={unit}
              onEdit={openEdit}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {editingUnit ? (
        <UnitFormModal
          key={editingUnit._id}
          mode="edit"
          isOpen={modalOpen}
          unit={editingUnit}
          onClose={closeModal}
        />
      ) : (
        <UnitFormModal
          key="create"
          mode="create"
          isOpen={modalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
