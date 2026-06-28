import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Package,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteProductImage,
  fetchProduct,
  formatCurrency,
  productsKeys,
} from "@/lib/products";

export const Route = createFileRoute("/_authenticated/products/$productId")({
  head: () => ({ meta: [{ title: "Product — DukaanAI" }] }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: productsKeys.detail(productId),
    queryFn: () => fetchProduct(productId),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!product) return;
      if (product.image_url) await deleteProductImage(product.image_url);
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: productsKeys.all });
      navigate({ to: "/inventory" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <MobileShell>
      <header className="-mx-6 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate({ to: "/inventory" })}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {product && (
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link
                to="/products/$productId/edit"
                params={{ productId: product.id }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
      ) : !product ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          Product not found.
        </div>
      ) : (
        <article className="mt-5 pb-8">
          <div className="aspect-square w-full overflow-hidden rounded-3xl border border-border bg-secondary">
            <ProductImage path={product.image_url} alt={product.name} />
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {product.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 font-medium text-on-primary-container">
                  <Tag className="h-3 w-3" /> {product.category}
                </span>
              )}
              {product.sku && <span>SKU: {product.sku}</span>}
            </div>
          </div>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric
              label="Selling price"
              value={formatCurrency(product.selling_price)}
              accent
            />
            <Metric
              label="Purchase price"
              value={formatCurrency(product.purchase_price)}
            />
            <Metric
              label="In stock"
              value={`${product.stock_quantity}`}
              icon={Package}
            />
            <Metric
              label="Low-stock alert"
              value={`${product.low_stock_threshold}`}
              icon={AlertTriangle}
              warn={product.stock_quantity <= product.low_stock_threshold}
            />
          </div>
        </article>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product and its image. This action can't
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                remove.mutate();
              }}
            >
              {remove.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  );
}

function Metric({
  label,
  value,
  accent,
  warn,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
  icon?: typeof Package;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 shadow-elevation-1 ${
        accent
          ? "border-primary/30 bg-primary-container text-on-primary-container"
          : warn
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card"
      }`}
    >
      <p className="flex items-center gap-1 text-[11px] font-medium opacity-80">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
