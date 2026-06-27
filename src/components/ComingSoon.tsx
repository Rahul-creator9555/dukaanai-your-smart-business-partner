import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  subtitle,
  icon: Icon,
  onBack,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span />
        )}
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <span className="h-10 w-10" />
      </div>

      <div className="my-auto flex flex-col items-center px-6 text-center animate-fade-in">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary-container text-on-primary-container shadow-elevation-2">
          <Icon className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
        <span className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
          Coming soon
        </span>
        {onBack && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="mt-6 h-12 rounded-2xl px-6"
          >
            Back to dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
