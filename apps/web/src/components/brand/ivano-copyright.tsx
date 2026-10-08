import { BRAND_COPYRIGHT } from "@/lib/brand";
import { cn } from "@/lib/utils";

type IvanoCopyrightProps = {
  className?: string;
  /** `muted` on paper, `navy` on ink surfaces, `dark` for print margins. */
  variant?: "muted" | "navy" | "dark";
};

const variantClass: Record<NonNullable<IvanoCopyrightProps["variant"]>, string> = {
  muted: "text-muted-foreground",
  navy: "text-[#9AA3AE]",
  dark: "text-ink"
};

/** The single credit line (© year + company) for sign in, reports and exports. 13px minimum. */
export function IvanoCopyright({ className, variant = "muted" }: IvanoCopyrightProps) {
  return (
    <p className={cn("text-[13px] leading-[18px] font-medium", variantClass[variant], className)}>
      {BRAND_COPYRIGHT}
    </p>
  );
}
