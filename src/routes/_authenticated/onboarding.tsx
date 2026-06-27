import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your shop — DukaanAI" }] }),
  component: Onboarding,
});

const CATEGORIES = [
  "Medical",
  "Grocery",
  "Clothing",
  "Electronics",
  "Cosmetics",
  "Hardware",
  "Stationery",
  "Other",
] as const;

const STEPS = [
  { id: 0, label: "Shop", icon: Store },
  { id: 1, label: "Owner", icon: User },
  { id: 2, label: "Location", icon: MapPin },
] as const;

type FormState = {
  shop_name: string;
  shop_category: string | null;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  shop_address: string;
};

const schema = z.object({
  shop_name: z.string().trim().min(2, "Shop name is too short").max(80),
  shop_category: z.string().min(1, "Pick a category"),
  full_name: z.string().trim().min(2, "Enter owner name").max(80),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid mobile number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Only digits and + - ( ) allowed"),
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().min(2, "Enter city").max(80),
  state: z.string().trim().min(2, "Enter state").max(80),
  shop_address: z.string().trim().min(5, "Enter shop address").max(300),
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    shop_name: "",
    shop_category: null,
    full_name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    shop_address: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) return;
      const { data: p } = await supabase
        .from("profiles")
        .select(
          "shop_name, shop_category, full_name, phone, city, state, shop_address",
        )
        .eq("id", u.id)
        .maybeSingle();
      setForm((f) => ({
        ...f,
        email: u.email ?? "",
        shop_name: p?.shop_name ?? f.shop_name,
        shop_category: p?.shop_category ?? f.shop_category,
        full_name: p?.full_name ?? f.full_name,
        phone: p?.phone ?? f.phone,
        city: p?.city ?? f.city,
        state: p?.state ?? f.state,
        shop_address: p?.shop_address ?? f.shop_address,
      }));
    });
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!schema.shape.shop_name.safeParse(form.shop_name).success)
        return "Enter a valid shop name";
      if (!form.shop_category) return "Pick a category";
      return null;
    }
    if (s === 1) {
      if (!schema.shape.full_name.safeParse(form.full_name).success)
        return "Enter owner name";
      if (!schema.shape.phone.safeParse(form.phone).success)
        return "Enter a valid mobile number";
      if (!schema.shape.email.safeParse(form.email).success)
        return "Enter a valid email";
      return null;
    }
    if (s === 2) {
      if (!schema.shape.city.safeParse(form.city).success) return "Enter city";
      if (!schema.shape.state.safeParse(form.state).success)
        return "Enter state";
      if (!schema.shape.shop_address.safeParse(form.shop_address).success)
        return "Enter shop address";
      return null;
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = async () => {
    const err = validateStep(2);
    if (err) return toast.error(err);
    const parsed = schema.safeParse(form);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0]?.message ?? "Check your inputs");

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Not signed in");
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        id: u.user.id,
        shop_name: parsed.data.shop_name,
        shop_category: parsed.data.shop_category,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
        shop_address: parsed.data.shop_address,
        onboarded: true,
      },
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate({ to: "/dashboard", replace: true });
  };

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step],
  );

  return (
    <MobileShell>
      <div className="flex items-center justify-between">
        <BrandMark size="sm" showName={false} />
        <span className="text-xs font-medium text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      <Stepper step={step} progress={progress} />

      <div className="mt-8 flex flex-1 flex-col">
        {step === 0 && (
          <StepShop
            shopName={form.shop_name}
            category={form.shop_category}
            onShopName={(v) => set("shop_name", v)}
            onCategory={(v) => set("shop_category", v)}
          />
        )}
        {step === 1 && (
          <StepOwner
            fullName={form.full_name}
            phone={form.phone}
            email={form.email}
            onFullName={(v) => set("full_name", v)}
            onPhone={(v) => set("phone", v)}
            onEmail={(v) => set("email", v)}
          />
        )}
        {step === 2 && (
          <StepLocation
            city={form.city}
            stateVal={form.state}
            address={form.shop_address}
            onCity={(v) => set("city", v)}
            onState={(v) => set("state", v)}
            onAddress={(v) => set("shop_address", v)}
          />
        )}

        <div className="mt-auto flex gap-3 pt-8">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="h-14 flex-1 rounded-2xl"
            >
              <ArrowLeft className="mr-1 h-5 w-5" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={next}
              size="lg"
              className="h-14 flex-[1.5] rounded-2xl text-base font-semibold shadow-elevation-2"
            >
              Continue <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={finish}
              disabled={saving}
              size="lg"
              className="h-14 flex-[1.5] rounded-2xl text-base font-semibold shadow-elevation-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Finish setup</>
              )}
            </Button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

function Stepper({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="mt-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-5 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = s.id < step;
          const active = s.id === step;
          return (
            <div
              key={s.id}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-background text-primary shadow-elevation-2"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  active || done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function StepShop({
  shopName,
  category,
  onShopName,
  onCategory,
}: {
  shopName: string;
  category: string | null;
  onShopName: (v: string) => void;
  onCategory: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Tell us about your shop"
        subtitle="We'll personalize DukaanAI for your business."
      />
      <Field id="shop" label="Shop name">
        <Input
          id="shop"
          placeholder="e.g. Sharma General Store"
          value={shopName}
          onChange={(e) => onShopName(e.target.value)}
          className="h-14 rounded-2xl text-base"
        />
      </Field>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Shop category</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCategory(c)}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-left text-sm font-medium transition-all ${
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
      </div>
    </div>
  );
}

function StepOwner({
  fullName,
  phone,
  email,
  onFullName,
  onPhone,
  onEmail,
}: {
  fullName: string;
  phone: string;
  email: string;
  onFullName: (v: string) => void;
  onPhone: (v: string) => void;
  onEmail: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Who runs the shop?"
        subtitle="We'll use these details for your account."
      />
      <Field id="owner" label="Owner name">
        <Input
          id="owner"
          placeholder="e.g. Ravi Sharma"
          value={fullName}
          onChange={(e) => onFullName(e.target.value)}
          className="h-14 rounded-2xl text-base"
        />
      </Field>
      <Field id="phone" label="Mobile number">
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          className="h-14 rounded-2xl text-base"
        />
      </Field>
      <Field id="email" label="Email">
        <Input
          id="email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          className="h-14 rounded-2xl text-base"
        />
      </Field>
    </div>
  );
}

function StepLocation({
  city,
  stateVal,
  address,
  onCity,
  onState,
  onAddress,
}: {
  city: string;
  stateVal: string;
  address: string;
  onCity: (v: string) => void;
  onState: (v: string) => void;
  onAddress: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Where is your shop?"
        subtitle="Helps customers and trends near you."
      />
      <div className="grid grid-cols-2 gap-3">
        <Field id="city" label="City">
          <Input
            id="city"
            placeholder="Mumbai"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            className="h-14 rounded-2xl text-base"
          />
        </Field>
        <Field id="state" label="State">
          <Input
            id="state"
            placeholder="Maharashtra"
            value={stateVal}
            onChange={(e) => onState(e.target.value)}
            className="h-14 rounded-2xl text-base"
          />
        </Field>
      </div>
      <Field id="address" label="Shop address">
        <Textarea
          id="address"
          placeholder="Street, area, landmark, pincode"
          value={address}
          onChange={(e) => onAddress(e.target.value)}
          rows={4}
          className="min-h-28 rounded-2xl text-base"
        />
      </Field>
    </div>
  );
}
