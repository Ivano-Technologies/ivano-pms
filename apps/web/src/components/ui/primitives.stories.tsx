import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MessageCircle } from "lucide-react";

import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./card";
import { CommandPaletteShell } from "./command-palette-shell";
import { SHELL_NAV_ITEMS } from "@/lib/shell-navigation";
import { Skeleton, SkeletonCard, SkeletonText } from "./skeleton";
import { StatusChip } from "./status-chip";
import { StatusKey } from "@/components/landing/stay-ribbon-preview";
import { IvanoPmsLockup } from "@/components/brand/ivano-pms-lockup";

const meta = {
  title: "Primitives/A.3 Layer",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Lobby Light primitives (Wave 1). Plain language labels, status via icon + label (never colour alone), 44px touch targets, 10px radius via --radius. The a11y addon checks contrast on every swatch and chip."
      }
    }
  }
} satisfies Meta;

export default meta;

export const ButtonVariants: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button>Confirm booking</Button>
      <Button variant="outline">Mark reviewed</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="destructive">Cancel booking</Button>
    </div>
  )
};

export const CardExample: StoryObj = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Gwarimpa Estate</CardTitle>
        <CardDescription>Occupancy today · 4 active bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">₦276,000 recognized revenue</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">View reports</Button>
      </CardFooter>
    </Card>
  )
};

export const StatusChips: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusChip tone="brand" icon={MessageCircle}>
        Telegram
      </StatusChip>
      <StatusChip tone="warning">Awaiting reply</StatusChip>
      <StatusChip tone="success">Booking confirmed</StatusChip>
      <StatusChip tone="danger">Conflict</StatusChip>
    </div>
  )
};

export const Skeletons: StoryObj = {
  render: () => (
    <div className="grid max-w-md gap-4">
      <Skeleton className="h-4 w-32" />
      <SkeletonText lines={3} />
      <SkeletonCard />
    </div>
  )
};

export const CommandPalette: StoryObj = {
  render: () => (
    <CommandPaletteShell
      open
      items={SHELL_NAV_ITEMS.map((item) => ({
        id: item.id,
        label: `Go to ${item.label}`,
        hint: item.hint,
        icon: item.icon
      }))}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Palette shell with all shell routes. Production wiring navigates via CommandPalette in the dashboard layout."
      }
    }
  }
};

const SWATCHES: { name: string; bg: string; fg: string; note: string }[] = [
  { name: "Ink", bg: "bg-ink", fg: "text-white", note: "#141B26 · sidebar, headings" },
  { name: "Ink 2", bg: "bg-ink-2", fg: "text-white", note: "#1A2230 · dark surfaces" },
  { name: "Paper", bg: "bg-paper", fg: "text-ink", note: "#FAF7F2 · app canvas" },
  { name: "Sunken", bg: "bg-sunken", fg: "text-ink", note: "#F3EEE6 · wells, table head" },
  { name: "Terracotta", bg: "bg-terracotta", fg: "text-white", note: "#B5472F · primary action" },
  { name: "Terracotta hover", bg: "bg-terracotta-hover", fg: "text-white", note: "#9A3B27" },
  { name: "Brass", bg: "bg-brass", fg: "text-white", note: "#9C7228 · today line" },
  { name: "Brass tint", bg: "bg-brass-tint", fg: "text-brass-text", note: "#F6EDDC · today wash" },
  { name: "Sage", bg: "bg-sage", fg: "text-white", note: "#4F7A5A · in house" },
  { name: "Rose", bg: "bg-rose", fg: "text-white", note: "#B23A48 · danger" }
];

export const LobbyTokens: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5">
      {SWATCHES.map((s) => (
        <div key={s.name} className={`${s.bg} ${s.fg} border-line rounded-lg border p-3`}>
          <p className="text-sm font-semibold">{s.name}</p>
          <p className="text-xs">{s.note}</p>
        </div>
      ))}
    </div>
  )
};

export const BookingStatusChips: StoryObj = {
  render: () => (
    <StatusKey
      states={[
        "inquiry",
        "pending_confirmation",
        "confirmed",
        "arriving",
        "checked_in",
        "checked_out",
        "completed",
        "cancelled"
      ]}
    />
  )
};

export const Lockups: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <div className="bg-paper rounded-lg p-4">
        <IvanoPmsLockup />
      </div>
      <div className="bg-ink rounded-lg p-4" data-surface="ink">
        <IvanoPmsLockup tone="navy" />
      </div>
    </div>
  )
};
