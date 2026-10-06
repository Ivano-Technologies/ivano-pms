import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type Iv1MarkProps = {
  /** `light` for paper and white surfaces, `navy` for ink surfaces. */
  tone?: "light" | "navy";
  /** Accessible name; omit when the mark sits next to visible product text. */
  title?: string;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "children">;

const FILLS = {
  light: { stroke: "#5C6673", body: "#141B26" },
  navy: { stroke: "#9AA3AE", body: "#FFFFFF" }
} as const;

/** IV1 split mark (Ivano Technologies). Inline SVG so it renders crisp at any size. */
export function Iv1Mark({ tone = "light", title, className, ...rest }: Iv1MarkProps) {
  const fill = FILLS[tone];
  return (
    <svg
      viewBox="0 0 297.85 212"
      className={cn("h-[29px] w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      <polygon points="16,16 52,16 155.92,196 119.92,196" fill={fill.stroke} />
      <polygon
        points="74,16 110,16 177.92,133.65 245.85,16 281.85,16 177.92,196"
        fill={fill.body}
      />
    </svg>
  );
}
