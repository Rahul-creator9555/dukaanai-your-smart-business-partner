import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center animate-fade-in",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive"
      >
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 h-10 rounded-xl"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
