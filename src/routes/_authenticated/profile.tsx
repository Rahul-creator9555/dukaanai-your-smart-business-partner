import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Mail, MapPin, Pencil, Phone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — DukaanAI" }] }),
  component: ProfilePage,
});

interface Profile {
  full_name: string | null;
  shop_name: string | null;
  shop_category: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  shop_address: string | null;
}

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, shop_name, shop_category, phone, city, state, shop_address")
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

  const initials =
    profile?.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "DA";

  return (
    <MobileShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <button
          onClick={() => navigate({ to: "/onboarding" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
          aria-label="Edit profile"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <section className="mt-6 flex flex-col items-center rounded-3xl border border-border bg-card p-6 shadow-elevation-1 animate-fade-in">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary text-2xl font-bold text-primary-foreground shadow-elevation-2">
          {initials}
        </div>
        <h2 className="mt-4 text-lg font-semibold">{profile?.full_name ?? "Owner"}</h2>
        <p className="text-sm text-muted-foreground">{profile?.shop_name ?? "Your shop"}</p>
        {profile?.shop_category && (
          <span className="mt-2 inline-block rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
            {profile.shop_category}
          </span>
        )}
      </section>

      <section className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card shadow-elevation-1">
        <InfoRow icon={Mail} label="Email" value={email || "—"} />
        <InfoRow icon={Phone} label="Mobile" value={profile?.phone || "—"} />
        <InfoRow icon={Store} label="Shop" value={profile?.shop_name || "—"} />
        <InfoRow
          icon={MapPin}
          label="Address"
          value={
            [profile?.shop_address, profile?.city, profile?.state]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
      </section>

      <div className="mt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={signOut}
          className="h-12 w-full rounded-2xl"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      <BottomNav />
    </MobileShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
