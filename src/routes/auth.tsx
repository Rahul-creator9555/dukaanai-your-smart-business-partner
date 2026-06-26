import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/BrandMark";
import { MobileShell } from "@/components/MobileShell";
import { GoogleButton } from "@/components/GoogleButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DukaanAI" },
      { name: "description", content: "Sign in or create your DukaanAI account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Required").max(80);

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <MobileShell>
      <div className="flex flex-col items-center pt-6 text-center">
        <BrandMark size="md" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your shop with AI.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="mt-8 w-full">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-secondary p-1">
          <TabsTrigger value="login" className="rounded-xl text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-elevation-1">
            Sign in
          </TabsTrigger>
          <TabsTrigger value="register" className="rounded-xl text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-elevation-1">
            Create account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <LoginForm onSuccess={() => navigate({ to: "/" })} />
        </TabsContent>
        <TabsContent value="register" className="mt-6">
          <RegisterForm onSuccess={() => navigate({ to: "/onboarding" })} />
        </TabsContent>
      </Tabs>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </MobileShell>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e1 = emailSchema.safeParse(email);
    const e2 = passwordSchema.safeParse(password);
    if (!e1.success) return toast.error(e1.error.issues[0].message);
    if (!e2.success) return toast.error(e2.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e1.data, password: e2.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />}>
        <Input
          id="email" type="email" autoComplete="email" placeholder="you@shop.com"
          value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl pl-10"
        />
      </Field>
      <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />}>
        <Input
          id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl pl-10 pr-12"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={loading} size="lg"
        className="h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nameSchema.safeParse(name);
    const e1 = emailSchema.safeParse(email);
    const e2 = passwordSchema.safeParse(password);
    if (!n.success) return toast.error(n.error.issues[0].message);
    if (!e1.success) return toast.error(e1.error.issues[0].message);
    if (!e2.success) return toast.error(e2.error.issues[0].message);

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: e1.data,
      password: e2.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: n.data },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    toast.success("Welcome to DukaanAI");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="name" label="Full name" icon={<UserIcon className="h-4 w-4" />}>
        <Input id="name" autoComplete="name" placeholder="Your name"
          value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl pl-10" />
      </Field>
      <Field id="r-email" label="Email" icon={<Mail className="h-4 w-4" />}>
        <Input id="r-email" type="email" autoComplete="email" placeholder="you@shop.com"
          value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl pl-10" />
      </Field>
      <Field id="r-password" label="Password" icon={<Lock className="h-4 w-4" />}>
        <Input id="r-password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="At least 6 characters"
          value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl pl-10 pr-12" />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      <Button type="submit" disabled={loading} size="lg"
        className="h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
