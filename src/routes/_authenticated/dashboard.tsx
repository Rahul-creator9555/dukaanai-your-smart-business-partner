import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Bell,
  Boxes,
  Clock,
  Package,
  PackagePlus,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — DukaanAI" }] }),
  component: Dashboard,
});

interface Profile {
  full_name: string | null;
  shop_name: string | null;
  shop_category: string | null;
}

function initials(name?: string | null, fallback = "DA") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || fallback;
}

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, shop_name, shop_category")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(p ?? null);
    });
  }, []);

  return (
    <MobileShell>
      {/* Header */}
      <header className="flex items-center justify-between animate-fade-in">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {greeting()},{" "}
            <span className="font-medium text-foreground">
              {profile?.full_name?.split(" ")[0] ?? "there"}
            </span>
          </p>
          <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight">
            {profile?.shop_name ?? "Your shop"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            aria-label="Profile"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-elevation-1 transition-transform hover:scale-105"
          >
            {initials(profile?.full_name ?? profile?.shop_name)}
          </button>
        </div>
      </header>

      {/* AI hero */}
      <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.40_0.18_265)] p-5 text-primary-foreground shadow-elevation-3 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> AI Assistant
            </span>
            <h2 className="mt-3 text-base font-semibold leading-snug">
              Get product ideas trending near you
            </h2>
            <p className="mt-1 text-xs text-primary-foreground/85">
              Tap to ask DukaanAI anything about your shop.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/assistant" })}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-primary-foreground transition-all hover:bg-white/25 hover:scale-105"
            aria-label="Open assistant"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Quick stats */}
      <section className="mt-6">
        <SectionTitle>Quick stats</SectionTitle>
        <div className="mt-3 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => navigate({ to: a.to })}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-container text-on-primary-container transition-transform group-hover:scale-105">
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <SectionTitle>Recent activity</SectionTitle>
          <button className="text-xs font-medium text-primary hover:underline">
            View all
          </button>
        </div>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card shadow-elevation-1">
          {ACTIVITY.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 p-3.5 transition-colors hover:bg-secondary/50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating add */}
      <button
        type="button"
        onClick={() => navigate({ to: "/products/new" })}
        aria-label="Add product"
        className="fixed bottom-24 right-[max(1.25rem,calc(50vw-13rem))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevation-3 transition-transform hover:scale-105 active:scale-95 sm:bottom-28"
      >
        <Plus className="h-6 w-6" strokeWidth={2.6} />
      </button>

      <BottomNav />
    </MobileShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Package;
  tone: "primary" | "accent" | "warn";
}) {
  const toneCls =
    tone === "warn"
      ? "bg-destructive/10 text-destructive"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-primary-container text-on-primary-container";
  return (
    <div className="group min-w-[10.5rem] flex-1 snap-start rounded-2xl border border-border bg-card p-4 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2">
      <div className="flex items-center justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{delta}</p>
    </div>
  );
}
