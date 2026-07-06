import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export function LoadingState({ label = "Loading…", className, size = "md" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground animate-fade-in",
        className,
      )}
    >
      <Loader2 className={cn(sizeMap[size], "animate-spin text-primary")} aria-hidden="true" />
      <p className="text-sm">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-shimmer rounded-2xl bg-muted", className)}
    />
  );
}
