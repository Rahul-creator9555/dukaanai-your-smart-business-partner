import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { ProductForm } from "@/components/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProduct, productsKeys } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/products/$productId/edit")({
  head: () => ({ meta: [{ title: "Edit product — DukaanAI" }] }),
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: productsKeys.detail(productId),
    queryFn: () => fetchProduct(productId),
  });

  return (
    <MobileShell>
      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : !product ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          Product not found.
        </div>
      ) : (
        <ProductForm mode="edit" initial={product} />
      )}
    </MobileShell>
  );
}
