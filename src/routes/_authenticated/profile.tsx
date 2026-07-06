import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  ChevronRight,
  Crown,
  Globe,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Sun,
  Moon,
  MonitorSmartphone,
  Zap,
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, useLang } from "@/lib/i18n";
import { useAiCredits, CREDIT_COST } from "@/hooks/use-ai-credits";

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

interface NotifPrefs {
  lowStock: boolean;
  trending: boolean;
  aiTips: boolean;
  weeklyReport: boolean;
  marketing: boolean;
}

const DEFAULT_NOTIFS: NotifPrefs = {
  lowStock: true,
  trending: true,
  aiTips: true,
  weeklyReport: false,
  marketing: false,
};

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
] as const;

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["Up to 50 products", "100 AI credits / month", "Basic analytics"],
    accent: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "per month",
    features: [
      "Unlimited products",
      "2,000 AI credits / month",
      "Advanced analytics + trends",
      "Priority email support",
    ],
    accent: true,
  },
  {
    id: "business",
    name: "Business",
    price: "₹1,499",
    period: "per month",
    features: [
      "Everything in Pro",
      "10,000 AI credits / month",
      "Multi-shop dashboard",
      "24×7 chat support",
    ],
    accent: false,
  },
] as const;

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [plan, setPlan] = useState<string>(() => localStorage.getItem("dk_plan") ?? "free");
  const [language, setLanguage] = useState<string>(
    () => localStorage.getItem("dk_lang") ?? "en",
  );
  const [langOpen, setLangOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifPrefs>(() => {
    try {
      return { ...DEFAULT_NOTIFS, ...JSON.parse(localStorage.getItem("dk_notifs") ?? "{}") };
    } catch {
      return DEFAULT_NOTIFS;
    }
  });
  const { mode: themeMode, setMode: setThemeMode } = useTheme();


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

  useEffect(() => {
    localStorage.setItem("dk_notifs", JSON.stringify(notifs));
  }, [notifs]);

  const currentPlan = useMemo(() => PLANS.find((p) => p.id === plan) ?? PLANS[0], [plan]);
  const currentLang = useMemo(
    () => LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0],
    [language],
  );

  // Mock AI usage — Free 100, Pro 2000, Business 10000
  const aiQuota = plan === "business" ? 10000 : plan === "pro" ? 2000 : 100;
  const aiUsed = plan === "business" ? 3120 : plan === "pro" ? 842 : 47;
  const aiPct = Math.min(100, Math.round((aiUsed / aiQuota) * 100));

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const choosePlan = (id: string) => {
    setPlan(id);
    localStorage.setItem("dk_plan", id);
    setPlanOpen(false);
    toast.success(`Switched to ${PLANS.find((p) => p.id === id)?.name} plan`);
  };

  const chooseLang = (code: string) => {
    setLanguage(code);
    localStorage.setItem("dk_lang", code);
    setLangOpen(false);
    toast.success(`Language: ${LANGUAGES.find((l) => l.code === code)?.native}`);
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
      {/* Top bar */}
      <header className="flex items-center justify-between animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <button
          onClick={() => navigate({ to: "/onboarding" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
          aria-label="Edit profile"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </header>

      {/* Hero card — Shop profile */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-container to-card p-5 shadow-elevation-2 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-primary text-xl font-bold text-primary-foreground shadow-elevation-2">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {profile?.full_name ?? "Owner"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {profile?.shop_name ?? "Your shop"}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {profile?.shop_category && (
                <span className="inline-flex items-center rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-elevation-1">
                  {profile.shop_category}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Crown className="h-2.5 w-2.5" /> {currentPlan.name}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-border/60 rounded-2xl bg-card/70 backdrop-blur">
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
        </div>
      </section>

      {/* Subscription plan */}
      <SectionLabel>Subscription</SectionLabel>
      <section className="mt-2 overflow-hidden rounded-3xl border border-border bg-card shadow-elevation-1">
        <div className="flex items-start gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
            <Crown className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{currentPlan.name} plan</p>
              <p className="text-xs text-muted-foreground">
                {currentPlan.price}{" "}
                <span className="text-[10px]">/{currentPlan.period}</span>
              </p>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {currentPlan.features[0]}
            </p>
          </div>
        </div>
        <Dialog open={planOpen} onOpenChange={setPlanOpen}>
          <DialogTrigger asChild>
            <button className="flex w-full items-center justify-center gap-1.5 border-t border-border bg-secondary/40 py-3 text-sm font-medium text-primary transition-colors hover:bg-secondary">
              <Sparkles className="h-4 w-4" /> Manage plan
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle>Choose your plan</DialogTitle>
              <DialogDescription>Upgrade anytime, cancel anytime.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3">
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => choosePlan(p.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-primary bg-primary-container shadow-elevation-2"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{p.name}</span>
                        {p.accent && (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold">
                        {p.price}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /{p.period}
                        </span>
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Star className="h-3 w-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* AI Usage */}
      <SectionLabel>AI usage</SectionLabel>
      <section className="mt-2 rounded-3xl border border-border bg-card p-4 shadow-elevation-1">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevation-1">
            <Zap className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">AI credits</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {aiUsed.toLocaleString("en-IN")}
                </span>{" "}
                / {aiQuota.toLocaleString("en-IN")}
              </p>
            </div>
            <Progress value={aiPct} className="mt-2 h-2" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Resets on 1st of every month · {100 - aiPct}% remaining
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <UsageStat label="Descriptions" value="18" />
          <UsageStat label="Chats" value="24" />
          <UsageStat label="Images" value="5" />
        </div>
      </section>

      {/* Language */}
      <SectionLabel>Preferences</SectionLabel>
      <section className="mt-2 divide-y divide-border rounded-3xl border border-border bg-card shadow-elevation-1">
        <Dialog open={langOpen} onOpenChange={setLangOpen}>
          <DialogTrigger asChild>
            <button className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
                <Globe className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Language</p>
                <p className="text-[11px] text-muted-foreground">
                  {currentLang.native} · {currentLang.label}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle>Select language</DialogTitle>
              <DialogDescription>Interface will update instantly.</DialogDescription>
            </DialogHeader>
            <RadioGroup value={language} onValueChange={chooseLang} className="mt-2 space-y-1">
              {LANGUAGES.map((l) => (
                <Label
                  key={l.code}
                  htmlFor={`lang-${l.code}`}
                  className="flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-colors hover:bg-secondary"
                >
                  <div>
                    <p className="text-sm font-medium">{l.native}</p>
                    <p className="text-[11px] text-muted-foreground">{l.label}</p>
                  </div>
                  <RadioGroupItem value={l.code} id={`lang-${l.code}`} />
                </Label>
              ))}
            </RadioGroup>
          </DialogContent>
        </Dialog>
      </section>

      {/* Appearance */}
      <SectionLabel>Appearance</SectionLabel>
      <section
        role="radiogroup"
        aria-label="Theme"
        className="mt-2 grid grid-cols-3 gap-2 rounded-3xl border border-border bg-card p-2 shadow-elevation-1"
      >
        {(
          [
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: MonitorSmartphone },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = themeMode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setThemeMode(id as ThemeMode)}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-xs font-medium transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container shadow-elevation-1"
                  : "bg-transparent text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </section>



      {/* Notifications */}
      <SectionLabel>Notifications</SectionLabel>
      <section className="mt-2 divide-y divide-border rounded-3xl border border-border bg-card shadow-elevation-1">
        <NotifRow
          icon={BellRing}
          title="Low stock alerts"
          subtitle="Get notified when items run low"
          checked={notifs.lowStock}
          onChange={(v) => setNotifs((n) => ({ ...n, lowStock: v }))}
        />
        <NotifRow
          icon={Sparkles}
          title="Trending products"
          subtitle="Weekly picks for your category"
          checked={notifs.trending}
          onChange={(v) => setNotifs((n) => ({ ...n, trending: v }))}
        />
        <NotifRow
          icon={Zap}
          title="AI tips"
          subtitle="Smart suggestions from DukaanAI"
          checked={notifs.aiTips}
          onChange={(v) => setNotifs((n) => ({ ...n, aiTips: v }))}
        />
        <NotifRow
          icon={Bell}
          title="Weekly report"
          subtitle="Sales & inventory summary on Monday"
          checked={notifs.weeklyReport}
          onChange={(v) => setNotifs((n) => ({ ...n, weeklyReport: v }))}
        />
        <NotifRow
          icon={Mail}
          title="Marketing emails"
          subtitle="Product updates & offers"
          checked={notifs.marketing}
          onChange={(v) => setNotifs((n) => ({ ...n, marketing: v }))}
        />
      </section>

      {/* Help Center */}
      <SectionLabel>Help</SectionLabel>
      <section className="mt-2 divide-y divide-border rounded-3xl border border-border bg-card shadow-elevation-1">
        <HelpRow
          icon={HelpCircle}
          title="Help center"
          subtitle="Guides & tutorials"
          onClick={() => toast.info("Help center coming soon")}
        />
        <HelpRow
          icon={MessageCircle}
          title="Contact support"
          subtitle="We reply within 24 hours"
          onClick={() => toast.info("Chat opening…")}
        />
        <HelpRow
          icon={LifeBuoy}
          title="Report a problem"
          subtitle="Send us feedback"
          onClick={() => toast.info("Thanks — form coming soon")}
        />
        <HelpRow
          icon={ShieldCheck}
          title="Privacy & terms"
          subtitle="How we handle your data"
          onClick={() => toast.info("Opening policy…")}
        />
      </section>

      {/* Sign out */}
      <div className="mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to sign in again to access your shop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={signOut}
                className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          DukaanAI · v1.0.0
        </p>
      </div>

      <BottomNav />
    </MobileShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
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
    <div className="flex items-start gap-3 p-3.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function NotifRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function HelpRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof HelpCircle;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-2.5 text-center">
      <p className="text-base font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
