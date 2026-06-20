import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type IvanoPmsLogoProps = {
  className?: string;
};

export function IvanoPmsLogo({ className }: IvanoPmsLogoProps) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>{BRAND_NAME}</span>
  );
}

/** @deprecated Use IvanoPmsLogo */
export const TechivanoLogo = IvanoPmsLogo;
