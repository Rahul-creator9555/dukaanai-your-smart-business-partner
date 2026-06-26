import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Sparkles, TrendingUp, Upload, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DukaanAI" }] }),
  component: Dashboard,
});

interface Profile {
  full_name: string | null;
  shop_name: string | null;
  shop_category: string | null;
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

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <MobileShell>
      <div className="flex items-center justify-between">
        <BrandMark size="sm" />
        <button onClick={signOut}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
          aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {profile?.shop_name ?? "Your shop"}
        </h1>
        {profile?.shop_category && (
          <span className="mt-2 inline-block rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
            {profile.shop_category}
          </span>
        )}
      </div>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.40_0.18_265)] p-6 text-primary-foreground shadow-elevation-3">
        <Sparkles className="h-6 w-6" />
        <h2 className="mt-3 text-lg font-semibold">Your AI assistant is on the way</h2>
        <p className="mt-1 text-sm text-primary-foreground/85">
          We're getting your store ready. Soon you'll add products, spot trends, and publish online — all with AI.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <FeatureCard icon={<Package className="h-5 w-5" />} title="Products" desc="Manage your catalog" />
        <FeatureCard icon={<TrendingUp className="h-5 w-5" />} title="Trends" desc="Discover hot items" />
        <FeatureCard icon={<Upload className="h-5 w-5" />} title="Publish" desc="Go online with AI" />
        <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Assistant" desc="Ask anything" />
      </div>

      <div className="mt-auto pt-8">
        <Button variant="outline" size="lg"
          onClick={() => navigate({ to: "/onboarding" })}
          className="h-12 w-full rounded-2xl">
          Edit shop details
        </Button>
      </div>
    </MobileShell>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1 transition-shadow hover:shadow-elevation-2">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-container text-on-primary-container">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      <span className="mt-2 inline-block text-[10px] font-medium uppercase tracking-wider text-primary">Coming soon</span>
    </div>
  );
}
