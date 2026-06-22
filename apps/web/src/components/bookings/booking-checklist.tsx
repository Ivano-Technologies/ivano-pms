"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { inputClassName } from "@/lib/guest-utils";
import { cn } from "@/lib/utils";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

type BookingChecklistProps = {
  bookingId: Id<"booking">;
};

const TASK_TYPES = [
  { value: "guest_checkin", label: "Guest check-in" },
  { value: "guest_checkout", label: "Guest check-out" },
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
  { value: "follow_up", label: "Follow-up" }
] as const;

export function BookingChecklist({ bookingId }: BookingChecklistProps) {
  const items = useQuery(api.functions.checklists.getChecklistsByBooking, {
    bookingId
  });
  const createChecklist = useMutation(api.functions.checklists.createChecklist);
  const updateStatus = useMutation(
    api.functions.checklists.updateChecklistStatus
  );
  const deleteChecklist = useMutation(api.functions.checklists.deleteChecklist);

  const [taskType, setTaskType] =
    useState<(typeof TASK_TYPES)[number]["value"]>("cleaning");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!description.trim() || !dueDate) {
      toast.error("Description and due date are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await createChecklist({
        bookingId,
        taskType,
        taskDescription: description,
        dueDate
      });
      setDescription("");
      setDueDate("");
      toast.success("Checklist item added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add checklist item"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items === undefined) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-medium">Add task</p>
        <select
          className={inputClassName}
          value={taskType}
          onChange={(e) =>
            setTaskType(e.target.value as (typeof TASK_TYPES)[number]["value"])
          }
        >
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          className={inputClassName}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className={inputClassName}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={isSubmitting}
          onClick={() => void handleCreate()}
        >
          {isSubmitting ? "Adding…" : "Add task"}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No checklist items yet.</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {items.map((item) => (
            <li key={item._id} className="flex items-start justify-between gap-2 py-2">
              <div>
                <p className="font-medium capitalize">
                  {item.taskType.replaceAll("_", " ")}
                </p>
                <p className="text-muted-foreground">{item.taskDescription}</p>
                <p className="text-muted-foreground text-xs">Due {item.dueDate}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <select
                  className={cn(inputClassName, "text-xs")}
                  value={item.status}
                  onChange={(e) =>
                    void updateStatus({
                      checklistId: item._id,
                      status: e.target.value as typeof item.status
                    }).catch((err: unknown) =>
                      toast.error(
                        err instanceof Error ? err.message : "Update failed"
                      )
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-7 text-xs"
                  onClick={() =>
                    void deleteChecklist({ checklistId: item._id }).catch(
                      (err: unknown) =>
                        toast.error(
                          err instanceof Error ? err.message : "Delete failed"
                        )
                    )
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
