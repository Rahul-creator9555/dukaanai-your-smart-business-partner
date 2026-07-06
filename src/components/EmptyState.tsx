import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-10 text-center animate-fade-in",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-container text-on-primary-container shadow-elevation-1"
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
