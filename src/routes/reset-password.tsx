import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — DukaanAI" },
      { name: "description", content: "Set a new password for your DukaanAI account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places recovery tokens in the URL hash and triggers a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.string().min(6, "At least 6 characters").max(72).safeParse(password);
    if (!p.success) return toast.error(p.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: p.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/" });
  };

  return (
    <MobileShell>
      <div className="mt-6 flex flex-col items-center text-center">
        <BrandMark size="sm" showName={false} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password you haven't used before.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <PwField id="p1" label="New password" value={password} onChange={setPassword} />
        <PwField id="p2" label="Confirm password" value={confirm} onChange={setConfirm} />
        <Button type="submit" disabled={loading || !ready} size="lg"
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update password"}
        </Button>
        {!ready && (
          <p className="text-center text-xs text-muted-foreground">
            Open this page from the reset link in your email.
          </p>
        )}
      </form>
    </MobileShell>
  );
}

function PwField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type="password" placeholder="••••••••"
          value={value} onChange={(e) => onChange(e.target.value)} className="h-14 rounded-2xl pl-10" />
      </div>
    </div>
  );
}
