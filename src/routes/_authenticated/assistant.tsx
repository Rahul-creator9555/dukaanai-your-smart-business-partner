import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Camera, Sparkles, Wand2 } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — DukaanAI" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <div className="flex min-h-full flex-col pb-4">
        <header className="-mx-6 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">AI Assistant</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            What would you like to do?
          </h1>
        </header>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/products/generate" })}
            className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-left text-primary-foreground shadow-lg shadow-primary/20"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <Wand2 className="h-5 w-5" />
              </span>
              <ArrowRight className="h-5 w-5 opacity-80 transition-transform group-hover:translate-x-1" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">AI Product Generator</h2>
            <p className="mt-1 text-sm text-primary-foreground/85">
              Upload a photo or type a name — get title, description, category,
              tags, and price in seconds.
            </p>
          </button>

          <Link
            to="/products/generate"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Scan a product</p>
              <p className="text-xs text-muted-foreground">
                Use a photo to auto-fill the listing
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center">
            <p className="text-sm font-medium text-foreground">More AI tools coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trend insights, bulk publishing, and chat support.
            </p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" disabled>
              Stay tuned
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileShell>
  );
}
