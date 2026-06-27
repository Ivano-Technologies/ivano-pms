import type { Meta, StoryObj } from "@storybook/react";
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
import { Skeleton, SkeletonCard, SkeletonText } from "./skeleton";
import { StatusChip } from "./status-chip";

const meta = {
  title: "Primitives/A.3 Layer",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Direction 3 Precision primitives. North-star check: plain-language labels, status via text+icon (not color alone), 44px touch targets on palette rows, 4px radius via --radius token."
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
  render: () => <CommandPaletteShell />,
  parameters: {
    docs: {
      description: {
        story: "Open with Ctrl+K. Shell only — wiring to routes lands in Phase B."
      }
    }
  }
};
