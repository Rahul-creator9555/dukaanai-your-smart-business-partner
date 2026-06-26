import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your shop — DukaanAI" }] }),
  component: Onboarding,
});

const CATEGORIES = [
  "Grocery", "Pharmacy", "Apparel", "Electronics", "Stationery", "Hardware",
  "Beauty & Salon", "Bakery", "Restaurant", "Other",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Prefill if profile already has data
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("shop_name, shop_category").eq("id", data.user.id).maybeSingle();
      if (p?.shop_name) setShopName(p.shop_name);
      if (p?.shop_category) setCategory(p.shop_category);
    });
  }, []);

  const finish = async () => {
    const n = z.string().trim().min(2, "Shop name is too short").max(80).safeParse(shopName);
    if (!n.success) return toast.error(n.error.issues[0].message);
    if (!category) return toast.error("Pick a category");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not signed in");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: u.user.id, shop_name: n.data, shop_category: category, onboarded: true }, { onConflict: "id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <MobileShell>
      <div className="flex items-center justify-between">
        <BrandMark size="sm" showName={false} />
        <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of 2</span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: step === 0 ? "50%" : "100%" }} />
      </div>

      {step === 0 && (
        <div className="mt-10 flex flex-1 flex-col">
          <Store className="h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">What's your shop called?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll use this across DukaanAI.
          </p>
          <div className="mt-8 space-y-1.5">
            <Label htmlFor="shop" className="text-sm font-medium">Shop name</Label>
            <Input id="shop" placeholder="e.g. Sharma General Store"
              value={shopName} onChange={(e) => setShopName(e.target.value)}
              className="h-14 rounded-2xl text-base" />
          </div>
          <Button
            type="button"
            onClick={() => {
              const n = z.string().trim().min(2).max(80).safeParse(shopName);
              if (!n.success) return toast.error("Enter a valid shop name");
              setStep(1);
            }}
            size="lg"
            className="mt-auto h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2"
          >
            Continue <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-10 flex flex-1 flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Pick a category</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What do you mostly sell?
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition-all ${
                    active
                      ? "border-primary bg-primary-container text-on-primary-container shadow-elevation-1"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  <span>{c}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex gap-3 pt-8">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}
              className="h-14 flex-1 rounded-2xl">
              Back
            </Button>
            <Button type="button" onClick={finish} disabled={saving} size="lg"
              className="h-14 flex-[1.5] rounded-2xl text-base font-semibold shadow-elevation-2">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finish setup"}
            </Button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
