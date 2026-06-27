import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — DukaanAI" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <ComingSoon
        title="Inventory"
        subtitle="Manage your products, stock and alerts here — coming soon."
        icon={Boxes}
        onBack={() => navigate({ to: "/dashboard" })}
      />
      <BottomNav />
    </MobileShell>
  );
}
