import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-[var(--radius)] bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonText({
  lines = 3,
  className
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("border-border space-y-3 rounded-[var(--radius)] border p-4", className)}
      aria-label="Loading content"
      role="status"
      aria-busy="true"
    >
      <Skeleton className="h-4 w-1/3" />
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonText }
