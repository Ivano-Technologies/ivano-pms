"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SHELL_NAV_ITEMS } from "@/lib/shell-navigation";
import {
  CommandPaletteShell,
  type CommandPaletteItem
} from "@/components/ui/command-palette-shell";

const PALETTE_ITEMS: CommandPaletteItem[] = SHELL_NAV_ITEMS.map((item) => ({
  id: item.id,
  label: `Go to ${item.label}`,
  hint: item.hint,
  icon: item.icon,
  href: item.href
}));

type CommandPaletteProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  function handleSelect(item: CommandPaletteItem) {
    if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <CommandPaletteShell
      items={PALETTE_ITEMS}
      open={resolvedOpen}
      onOpenChange={setOpen}
      onSelect={handleSelect}
    />
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
