import { stayStateClass, stayStateMeta, type StayDisplayState } from "@/lib/booking-status-colors";
import { cn } from "@/lib/utils";

/* EXAMPLE DATA ONLY: decorative week on the sign in panel. */
const DAYS = ["Mon", "Today", "Wed", "Thu"];
const ROWS: { room: string; state: StayDisplayState; left: number; width: number; guest: string }[] = [
  { room: "101", state: "checked_in", left: 0, width: 62, guest: "Adaeze O." },
  { room: "102", state: "arriving", left: 38, width: 62, guest: "Musa B." },
  { room: "202", state: "pending_confirmation", left: 63, width: 37, guest: "Ibrahim S." }
];

export function SignInRibbon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative max-w-[440px] rounded-[14px] border border-[#2C3646] bg-[#1A2230] px-4 py-3.5",
        className
      )}
      role="img"
      aria-label="Example of this week's stays"
    >
      <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-[#C9CFD6]">
        <span>This week</span>
        <span className="bg-brass-tint text-brass-text inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold">
          Example data
        </span>
      </div>
      <div className="grid grid-cols-[44px_repeat(4,minmax(0,1fr))] items-center" aria-hidden>
        <span />
        {DAYS.map((d) => (
          <span
            key={d}
            className={cn(
              "text-center text-xs font-semibold",
              d === "Today" ? "text-[#E2B866]" : "text-[#9AA3AE]"
            )}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="relative" aria-hidden>
        {/* Today line: start of the second day column */}
        <span
          className="absolute top-0 bottom-1 z-[4] w-0.5 bg-[#E2B866]"
          style={{ left: "calc(44px + (100% - 44px) * 0.25)" }}
        />
        {ROWS.map((r) => {
          const meta = stayStateMeta(r.state);
          const Icon = meta.icon;
          const contLeft = r.left === 0;
          const contRight = r.left + r.width >= 100;
          return (
            <div
              key={r.room}
              className="grid h-[38px] grid-cols-[44px_minmax(0,1fr)] items-center border-t border-[#2C3646]"
            >
              <b className="text-xs font-semibold text-[#C9CFD6]">{r.room}</b>
              <div className="relative h-full">
                <div
                  className={cn(
                    "stay-ribbon absolute top-[5px] flex h-7 items-center gap-1.5 overflow-hidden pr-3.5 pl-2 text-[12.5px] font-semibold whitespace-nowrap",
                    stayStateClass(r.state)
                  )}
                  data-cont-left={contLeft || undefined}
                  data-cont-right={contRight || undefined}
                  style={{ left: `${r.left}%`, width: `${r.width}%` }}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">{r.guest}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
