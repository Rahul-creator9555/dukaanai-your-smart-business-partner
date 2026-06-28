import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ProductForm } from "@/components/ProductForm";

export const Route = createFileRoute("/_authenticated/products/new")({
  head: () => ({ meta: [{ title: "New product — DukaanAI" }] }),
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <MobileShell>
      <ProductForm mode="create" />
    </MobileShell>
  );
}
