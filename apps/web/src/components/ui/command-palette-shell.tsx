"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CommandPaletteItem = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
};

type CommandPaletteShellProps = {
  items: CommandPaletteItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (item: CommandPaletteItem) => void;
  className?: string;
};

export function CommandPaletteShell({
  items,
  open: openProp,
  onOpenChange,
  onSelect,
  className
}: CommandPaletteShellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const filtered = items.filter((item) =>
    `${item.label} ${item.hint ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  function handleSelect(item: CommandPaletteItem) {
    onSelect?.(item);
    setOpen(false);
    setQuery("");
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]", className)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="border-border bg-card relative w-full max-w-lg overflow-hidden rounded-[var(--radius)] border shadow-xl"
      >
        <div className="border-border flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            className="placeholder:text-muted-foreground h-11 flex-1 bg-transparent text-sm outline-none"
            aria-label="Search commands"
          />
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex size-11 items-center justify-center"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2" role="listbox" aria-label="Commands">
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">No matching actions</li>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  className="hover:bg-muted flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-left text-sm"
                  onClick={() => handleSelect(item)}
                >
                  <item.icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <span className="font-medium">{item.label}</span>
                  {item.hint ? (
                    <span className="text-muted-foreground ml-auto text-xs">{item.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-border text-muted-foreground border-t px-3 py-2 text-xs">
          Tip: press <kbd className="rounded border px-1">Ctrl</kbd>+
          <kbd className="rounded border px-1">K</kbd> from anywhere
        </div>
      </div>
    </div>
  );
}
