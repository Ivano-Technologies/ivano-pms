import { cn } from "@/lib/utils";

/** Lobby Light button styles for public pages (landing, sign in). */
export function lobbyButton(
  variant: "primary" | "secondary" = "primary",
  className?: string
): string {
  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold whitespace-nowrap",
    "transition-[background-color,transform,box-shadow] duration-[var(--duration-micro)] ease-[var(--ease-lobby)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    variant === "primary"
      ? "bg-terracotta hover:bg-terracotta-hover text-white shadow-[var(--shadow-e1)]"
      : "text-ink border border-[#D6CFC2] bg-white hover:bg-sunken",
    className
  );
}
