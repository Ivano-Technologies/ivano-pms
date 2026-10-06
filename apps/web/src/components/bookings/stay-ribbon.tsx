import type { CSSProperties } from "react";

import {
  stayStateClass,
  stayStateMeta,
  type StayDisplayState
} from "@/lib/booking-status-colors";
import { cn } from "@/lib/utils";

/**
 * Stay ribbon week calendar (BRAND-SYSTEM §1). Each stay runs from midday of check in
 * to midday of check out, with an arrow tip on the departure end. Pure presentational:
 * Wave 1 feeds it static example data on the landing; Wave 3 feeds it real bookings.
 */

export type StayRibbonStay = {
  id: string;
  guest: string;
  state: StayDisplayState;
  /** Day index of check in, relative to the first visible day (may be negative). */
  start: number;
  /** Day index of check out (exclusive midday), may exceed the visible range. */
  end: number;
  /** Optional suffix, for example "leaving". */
  note?: string;
};

export type StayRibbonRoom = {
  id: string;
  name: string;
  type?: string;
  stays: StayRibbonStay[];
};

type StayRibbonCalendarProps = {
  days: string[];
  todayIndex?: number;
  rooms: StayRibbonRoom[];
  /** Width of the room column in px. */
  roomColumnWidth?: number;
  className?: string;
  /** Accessible summary, e.g. "Example week of stays". */
  label?: string;
};

function ribbonLabel(guest: string, spanDays: number): string {
  const [first, last] = guest.split(" ");
  if (spanDays >= 1.2 && last) return `${first} ${last[0]}.`;
  if (spanDays >= 0.7) return first ?? guest;
  return "";
}

export function StayRibbonBar({
  stay,
  dayCount,
  roomName
}: {
  stay: StayRibbonStay;
  dayCount: number;
  roomName: string;
}) {
  let x0 = stay.start + 0.5;
  let x1 = stay.end + 0.5;
  const contLeft = x0 < 0;
  const contRight = x1 > dayCount;
  if (contLeft) x0 = 0;
  if (contRight) x1 = dayCount;
  if (x1 <= 0 || x0 >= dayCount) return null;

  const meta = stayStateMeta(stay.state);
  const Icon = meta.icon;
  const span = x1 - x0;
  const text = ribbonLabel(stay.guest, span);
  const style: CSSProperties = {
    left: `calc(${(x0 / dayCount) * 100}% + 1.5px)`,
    width: `calc(${(span / dayCount) * 100}% - 3px)`
  };

  return (
    <div
      className={cn(
        "stay-ribbon absolute top-2 z-[3] flex h-7 items-center gap-1.5 overflow-hidden pr-3.5 pl-2 text-[12.5px] font-semibold whitespace-nowrap shadow-[var(--shadow-e1)]",
        stayStateClass(stay.state)
      )}
      data-cont-left={contLeft || undefined}
      data-cont-right={contRight || undefined}
      style={style}
      role="img"
      aria-label={`${stay.guest}, room ${roomName}, ${meta.label}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {text ? (
        <span className="truncate">
          {text}
          {stay.note && span >= 1.4 ? ` · ${stay.note}` : null}
        </span>
      ) : null}
    </div>
  );
}

export function StayRibbonCalendar({
  days,
  todayIndex,
  rooms,
  roomColumnWidth = 150,
  className,
  label = "Week of stays by room"
}: StayRibbonCalendarProps) {
  const dayCount = days.length;
  const cols: CSSProperties = {
    gridTemplateColumns: `${roomColumnWidth}px minmax(0, 1fr)`
  };
  const dayGrid: CSSProperties = { gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` };

  return (
    <div
      className={cn(
        "border-line relative overflow-hidden rounded-[14px] border bg-white",
        className
      )}
      role="group"
      aria-label={label}
    >
      <div className="bg-sunken border-line grid border-b" style={cols}>
        <div className="text-muted-foreground py-2 pl-3.5 text-xs font-semibold">Room</div>
        <div className="grid" style={dayGrid}>
          {days.map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-2 text-center text-xs font-semibold",
                i === todayIndex ? "text-brass-text" : "text-muted-foreground"
              )}
            >
              {i === todayIndex ? "Today" : d}
            </div>
          ))}
        </div>
      </div>
      {rooms.map((room) => (
        <div key={room.id} className="border-line grid h-11 border-b last:border-b-0" style={cols}>
          <div className="border-line flex min-w-0 flex-col justify-center border-r px-3.5">
            <b className="text-[13px] leading-4 font-semibold">{room.name}</b>
            {room.type ? (
              <span className="text-muted-foreground truncate text-xs leading-4 font-medium">
                {room.type}
              </span>
            ) : null}
          </div>
          <div className="relative">
            <div className="absolute inset-0 grid" style={dayGrid} aria-hidden>
              {days.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "border-line border-r last:border-r-0",
                    i === todayIndex && "border-l-brass bg-brass-tint/70 border-l-2"
                  )}
                />
              ))}
            </div>
            {room.stays.map((stay) => (
              <StayRibbonBar key={stay.id} stay={stay} dayCount={dayCount} roomName={room.name} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
