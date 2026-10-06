import {
  CalendarDays,
  ChartColumn,
  House,
  Inbox,
  Settings,
  Users,
  Building2
} from "lucide-react";

import { Iv1Mark } from "@/components/brand/iv1-mark";
import { StayRibbonCalendar, type StayRibbonRoom } from "@/components/bookings/stay-ribbon";
import {
  stayStateClass,
  stayStateMeta,
  type StayDisplayState
} from "@/lib/booking-status-colors";
import { cn } from "@/lib/utils";

import { ScaleToFit } from "./scale-to-fit";

/*
  EXAMPLE DATA ONLY. Wuse Garden Suites is fictional; week of Mon 5 Oct 2026, today Tue 6 Oct.
  This is a public page: never query Convex here.
*/
const DAYS = ["Mon 5", "Tue 6", "Wed 7", "Thu 8", "Fri 9", "Sat 10", "Sun 11"];
const TODAY = 1;
const ROOMS: StayRibbonRoom[] = [
  {
    id: "101",
    name: "101",
    type: "Deluxe King",
    stays: [{ id: "a", guest: "Adaeze Okafor", state: "checked_in", start: -2, end: 3 }]
  },
  {
    id: "102",
    name: "102",
    type: "Deluxe King",
    stays: [{ id: "b", guest: "Musa Bello", state: "arriving", start: 1, end: 4 }]
  },
  {
    id: "201",
    name: "201",
    type: "Executive Suite",
    stays: [
      { id: "c", guest: "Chinedu Eze", state: "checked_in", start: -3, end: 1, note: "leaving" },
      { id: "d", guest: "Funke Adeyemi", state: "inquiry", start: 3, end: 6 }
    ]
  },
  {
    id: "202",
    name: "202",
    type: "Studio",
    stays: [{ id: "e", guest: "Ibrahim Sule", state: "pending_confirmation", start: 2, end: 5 }]
  },
  {
    id: "301",
    name: "301",
    type: "Two Bedroom Apartment",
    stays: [
      { id: "f", guest: "Ngozi Nwosu", state: "checked_out", start: -3, end: 0 },
      { id: "g", guest: "Tolu Bakare", state: "confirmed", start: 4, end: 9 }
    ]
  }
];

const KEY: StayDisplayState[] = [
  "inquiry",
  "pending_confirmation",
  "confirmed",
  "arriving",
  "checked_in",
  "checked_out"
];

const RAIL = [House, CalendarDays, Inbox, Users, Building2, ChartColumn, Settings];

export function ExampleDataTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-brass-tint text-brass-text inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold tracking-[0.02em]",
        className
      )}
    >
      Example data
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-line rounded-[10px] border bg-white px-3.5 py-3">
      <small className="text-muted-foreground block text-xs font-semibold">{label}</small>
      <b className={cn("text-2xl font-bold", accent ? "text-terracotta" : "text-ink")}>{value}</b>
    </div>
  );
}

function PreviewShell() {
  return (
    <div className="border-line bg-paper text-ink flex overflow-hidden rounded-2xl border text-left shadow-[var(--shadow-e3)]">
      <aside
        className="bg-ink flex w-[68px] flex-none flex-col items-center gap-1.5 py-[18px]"
        data-surface="ink"
        aria-hidden
      >
        <Iv1Mark tone="navy" className="mb-3.5 h-[22px]" />
        {RAIL.map((Icon, i) => (
          <span
            key={i}
            className={cn(
              "relative flex size-[42px] items-center justify-center rounded-[10px] text-[#C9CFD6]",
              i === 0 && "bg-[#2C3646] text-white"
            )}
          >
            {i === 0 ? (
              <span className="bg-terracotta absolute top-[9px] bottom-[9px] -left-[13px] w-[3px] rounded-r-[3px]" />
            ) : null}
            {i === 2 ? (
              <i className="bg-terracotta absolute top-[9px] right-[9px] size-2 rounded-full shadow-[0_0_0_2px_#141B26]" />
            ) : null}
            <Icon className="size-[18px]" />
          </span>
        ))}
      </aside>
      <div className="min-w-0 flex-1 px-6 py-[22px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-[30px] leading-[1.1] font-medium">Today</p>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Wuse Garden Suites · Tue 6 Oct
            </p>
          </div>
          <ExampleDataTag />
        </div>
        <div className="mb-4 grid grid-cols-4 gap-3">
          <Stat label="Occupied tonight" value="80%" />
          <Stat label="Arriving" value="2" />
          <Stat label="Leaving" value="1" />
          <Stat label="New messages" value="3" accent />
        </div>
        <StayRibbonCalendar
          days={DAYS}
          todayIndex={TODAY}
          rooms={ROOMS}
          label="Example week of stays at Wuse Garden Suites"
        />
      </div>
    </div>
  );
}

export function StatusKey({ states = KEY, className }: { states?: StayDisplayState[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Status key">
      {states.map((s) => {
        const meta = stayStateMeta(s);
        const Icon = meta.icon;
        return (
          <li
            key={s}
            className={cn(
              "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
              stayStateClass(s)
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {meta.label}
          </li>
        );
      })}
    </ul>
  );
}

export function StayRibbonPreview() {
  return (
    <figure aria-label="Example of the Today view with a week of stays">
      <ScaleToFit designWidth={880}>
        <PreviewShell />
      </ScaleToFit>
      <StatusKey className="mt-4" />
    </figure>
  );
}
