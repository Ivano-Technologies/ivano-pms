import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { BottomTabBar } from "./bottom-tab-bar";
import { CommandBar } from "./command-bar";
import { CommandPalette } from "./command-palette";
import {
  ContextPanel,
  ContextPanelProvider,
  useContextPanel
} from "./context-panel";
import { NavRail } from "./nav-rail";
import { PropertyProvider } from "./property-context";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Shell/B. Phase",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Phase B shell: command bar (property switcher + search), nav rail, mobile tabs, and shared context panel. Existing features stay on their pages — bulk import on Guests, Telegram/Email cards on Settings."
      }
    }
  }
} satisfies Meta;

export default meta;

function ShellPreview() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <PropertyProvider>
      <ContextPanelProvider>
        <div className="bg-background text-foreground flex min-h-[32rem] flex-col">
          <CommandBar onOpenPalette={() => setPaletteOpen(true)} />
          <div className="flex min-h-0 flex-1">
            <NavRail />
            <div className="flex min-h-0 min-w-0 flex-1">
              <main className="flex-1 overflow-y-auto p-6">
                <h1 className="text-xl font-semibold">Workspace</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Active view renders here. Context panel opens for booking/guest
                  detail in Phase C.
                </p>
                <ContextPanelDemoButton />
              </main>
              <ContextPanel />
            </div>
          </div>
          <BottomTabBar />
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </ContextPanelProvider>
    </PropertyProvider>
  );
}

function ContextPanelDemoButton() {
  const { setOpen, setTitle, setContent } = useContextPanel();

  return (
    <Button
      type="button"
      className="mt-4"
      variant="outline"
      onClick={() => {
        setTitle("Booking context");
        setContent(
          <p className="text-muted-foreground text-sm">
            Guest history, linked booking, and checklist preview land here in
            Phase C.
          </p>
        );
        setOpen(true);
      }}
    >
      Preview context panel
    </Button>
  );
}

export const DesktopShell: StoryObj = {
  render: () => <ShellPreview />
};

export const NavRailOnly: StoryObj = {
  render: () => (
    <div className="bg-background p-4">
      <NavRail />
    </div>
  )
};

export const MobileTabs: StoryObj = {
  render: () => (
    <div className="bg-background">
      <BottomTabBar />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: "mobile1" }
  }
};
