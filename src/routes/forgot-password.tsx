import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "@/components/MobileShell";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DukaanAI" },
      { name: "description", content: "Reset your DukaanAI account password." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email("Enter a valid email").max(255).safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <MobileShell>
      <Link to="/auth" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mt-6 flex flex-col items-center text-center">
        <BrandMark size="sm" showName={false} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="mt-10 rounded-3xl bg-primary-container p-6 text-center text-on-primary-container">
          <Mail className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm font-medium">
            If an account exists for {email}, a reset link has been sent.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" placeholder="you@shop.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl pl-10" />
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
    </MobileShell>
  );
}
