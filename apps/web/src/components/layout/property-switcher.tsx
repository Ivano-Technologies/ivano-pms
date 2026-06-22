"use client";

import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { inputClassName } from "@/lib/unit-utils";

import { usePropertyScope } from "./property-context";

export function PropertySwitcher() {
  const properties = useQuery(api.functions.managers.getMyProperties);
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyScope();

  if (!properties || properties.length <= 1) {
    return null;
  }

  return (
    <label className="mb-4 block space-y-1">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Property
      </span>
      <select
        className={inputClassName}
        value={selectedPropertyId ?? properties[0]?._id ?? ""}
        onChange={(e) =>
          setSelectedPropertyId(e.target.value as Id<"property">)
        }
        aria-label="Select property"
      >
        {properties.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
