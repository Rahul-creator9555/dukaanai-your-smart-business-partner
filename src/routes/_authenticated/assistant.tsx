import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — DukaanAI" }] }),
  component: AssistantPage,
});

function AssistantPage() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <ComingSoon
        title="AI Assistant"
        subtitle="Ask anything about your shop. Coming soon."
        icon={Sparkles}
        onBack={() => navigate({ to: "/dashboard" })}
      />
      <BottomNav />
    </MobileShell>
  );
}
