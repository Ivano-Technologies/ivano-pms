import { cn } from "@/lib/utils";

/** IVA-189: the small muted "Ref: XXXXXXXX" support code shown under a friendly error. */
export function ErrorRef({
  code,
  className,
}: {
  code?: string | null;
  className?: string;
}) {
  if (!code) return null;
  return (
    <span
      data-testid="error-ref"
      className={cn("text-muted-foreground mt-1 block text-xs", className)}
    >
      Ref: {code}
    </span>
  );
}
