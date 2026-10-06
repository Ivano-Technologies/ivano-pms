import { CalendarCheck, CircleCheck, MessageCircle, Users, type LucideIcon } from "lucide-react";

type Feature = { icon: LucideIcon; title: string; body: string; points: string[] };

const FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Bookings",
    body: "Every stay on one calendar, from first inquiry to checkout. Check guests in and out in one tap.",
    points: ["Calendar by room and day", "Clear status on every stay", "Prices in naira"]
  },
  {
    icon: Users,
    title: "Guests and units",
    body: "Guest details, stay history and room status kept together, ready when someone walks in.",
    points: [
      "Import guests from a spreadsheet",
      "Rooms, suites and apartments",
      "Maintenance and reserved rooms"
    ]
  },
  {
    icon: MessageCircle,
    title: "Channel messages",
    body: "WhatsApp, Telegram and email inquiries land in one inbox and turn into bookings without retyping.",
    points: ["One inbox for every channel", "Convert a message to a booking", "Reply from where you work"]
  }
];

export function FeatureTrio() {
  return (
    <section id="features" className="scroll-mt-6 py-11 sm:pt-6 sm:pb-[72px]" aria-labelledby="features-heading">
      <span id="how-it-works" className="block scroll-mt-6" aria-hidden />
      <h2
        id="features-heading"
        className="font-display text-ink text-[28px] leading-[34px] font-medium sm:text-[40px] sm:leading-[46px]"
      >
        Everything the front desk needs, nothing it does not
      </h2>
      <p className="text-muted-foreground mt-3 max-w-[40em] text-base leading-[25px] sm:text-lg sm:leading-7">
        Three tools that work together, so every stay is easy to follow.
      </p>
      <div className="mt-9 grid grid-cols-1 gap-3.5 md:grid-cols-3 md:gap-5">
        {FEATURES.map(({ icon: Icon, title, body, points }) => (
          <article
            key={title}
            className="lobby-lift border-line rounded-[14px] border bg-white p-7 shadow-[var(--shadow-e1)]"
          >
            <div className="bg-terracotta-tint text-terracotta-hover mb-[18px] flex size-11 items-center justify-center rounded-[10px]">
              <Icon className="size-[18px]" aria-hidden />
            </div>
            <h3 className="font-display text-ink mb-2 text-[22px] leading-7 font-medium">{title}</h3>
            <p className="text-muted-foreground text-[15px] leading-6">{body}</p>
            <ul className="border-line mt-4 grid gap-2 border-t pt-3.5">
              {points.map((p) => (
                <li key={p} className="text-ink flex items-center gap-2 text-sm font-medium">
                  <CircleCheck className="text-sage size-4 shrink-0" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
