"use client";

import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { BRAND_NAME } from "@/lib/brand";
import { getPropertyAccentColor } from "@/lib/property-accent";
import { inputClassName } from "@/lib/unit-utils";
import { cn } from "@/lib/utils";

import { usePropertyScope } from "./property-context";

type CommandBarProps = {
  onOpenPalette: () => void;
  className?: string;
};

export function CommandBar({ onOpenPalette, className }: CommandBarProps) {
  const properties = useQuery(api.functions.managers.getMyProperties);
  const { selectedPropertyId, setSelectedPropertyId } = usePropertyScope();

  const activeProperty =
    properties?.find((property) => property._id === selectedPropertyId) ??
    properties?.[0];

  const accentColor = activeProperty
    ? getPropertyAccentColor(activeProperty._id)
    : undefined;

  return (
    <header
      className={cn(
        "border-border bg-card flex h-14 shrink-0 items-center gap-3 border-b px-4",
        className
      )}
      style={
        accentColor
          ? ({ "--property-accent": accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className="bg-[var(--property-accent,transparent)] h-full w-1 shrink-0 rounded-full"
        aria-hidden
      />
      <div className="min-w-0 shrink-0 font-semibold sm:w-28">{BRAND_NAME}</div>

      {properties && properties.length > 1 ? (
        <label className="hidden min-w-0 sm:block sm:max-w-xs sm:flex-1">
          <span className="sr-only">Select property</span>
          <select
            className={cn(inputClassName, "h-9 text-sm")}
            value={selectedPropertyId ?? properties[0]?._id ?? ""}
            onChange={(e) =>
              setSelectedPropertyId(e.target.value as Id<"property">)
            }
            aria-label="Select property"
          >
            {properties.map((property) => (
              <option key={property._id} value={property._id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
      ) : activeProperty ? (
        <p className="text-muted-foreground hidden truncate text-sm sm:block">
          {activeProperty.name}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onOpenPalette}
        className="border-border bg-background text-muted-foreground hover:text-foreground flex min-h-11 flex-1 items-center gap-2 rounded-[var(--radius)] border px-3 text-left text-sm"
        aria-label="Open command palette"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Search pages…</span>
        <kbd className="border-border ml-auto hidden rounded border px-1.5 py-0.5 text-xs sm:inline">
          Ctrl K
        </kbd>
      </button>

      <UserButton />
    </header>
  );
}
