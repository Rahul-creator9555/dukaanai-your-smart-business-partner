import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => ({ meta: [{ title: "Trends — DukaanAI" }] }),
  component: TrendsPage,
});

function TrendsPage() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <ComingSoon
        title="Trending Products"
        subtitle="AI-curated products that are hot in your area — coming soon."
        icon={TrendingUp}
        onBack={() => navigate({ to: "/dashboard" })}
      />
      <BottomNav />
    </MobileShell>
  );
}
