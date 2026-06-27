"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { CommandBar } from "@/components/layout/command-bar";
import { CommandPalette } from "@/components/layout/command-palette";
import {
  ContextPanel,
  ContextPanelProvider
} from "@/components/layout/context-panel";
import { NavRail } from "@/components/layout/nav-rail";
import { PropertyProvider } from "@/components/layout/property-context";

export function PmsDashboardLayout({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <PropertyProvider>
      <ContextPanelProvider>
        <div className="bg-background text-foreground flex min-h-screen flex-col">
          <CommandBar onOpenPalette={() => setPaletteOpen(true)} />
          <div className="flex min-h-0 flex-1">
            <NavRail className="hidden md:flex" />
            <div className="flex min-h-0 min-w-0 flex-1">
              <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
                {children}
              </main>
              <ContextPanel />
            </div>
          </div>
          <BottomTabBar className="fixed inset-x-0 bottom-0 z-40 md:hidden" />
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </ContextPanelProvider>
    </PropertyProvider>
  );
}
