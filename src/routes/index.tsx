import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DukaanAI — AI for local retailers" },
      { name: "description", content: "DukaanAI helps local retailers digitize their stores with an AI-powered assistant." },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.onboarded) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        navigate({ to: "/onboarding", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-primary-container/40 via-background to-background px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="animate-in fade-in zoom-in-50 duration-700">
          <BrandMark size="lg" showName={false} />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dukaan<span className="text-primary">AI</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI shop assistant
          </p>
        </div>
        <div className="mt-8 flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary/30 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
