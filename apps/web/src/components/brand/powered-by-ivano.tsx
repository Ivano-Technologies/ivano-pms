import { POWERED_BY_LINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

type PoweredByIvanoProps = {
  className?: string;
  /** `muted` on paper, `navy` on ink surfaces, `dark` for print margins. */
  variant?: "muted" | "navy" | "dark";
};

const variantClass: Record<NonNullable<PoweredByIvanoProps["variant"]>, string> = {
  muted: "text-muted-foreground",
  navy: "text-[#9AA3AE]",
  dark: "text-ink"
};

/** Attribution line for the landing, sign in, reports and exports. Sentence case, 13px minimum. */
export function PoweredByIvano({ className, variant = "muted" }: PoweredByIvanoProps) {
  return (
    <p className={cn("text-[13px] leading-[18px] font-medium", variantClass[variant], className)}>
      {POWERED_BY_LINE}
    </p>
  );
}
