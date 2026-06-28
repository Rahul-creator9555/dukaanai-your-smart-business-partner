import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Boxes, PackagePlus, Plus, Search, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ProductImage } from "@/components/ProductImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_CATEGORIES,
  fetchProducts,
  formatCurrency,
  productsKeys,
} from "@/lib/products";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — DukaanAI" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: productsKeys.list(),
    queryFn: fetchProducts,
  });

  const filtered = useMemo(() => {
    const list = products ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Products</h1>
            <p className="text-xs text-muted-foreground">
              {products?.length ?? 0} item{(products?.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elevation-1 transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Link>
      </header>

      {/* Search */}
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, SKU, category"
          className="h-11 rounded-2xl pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={!category} onClick={() => setCategory(null)}>
          All
        </Chip>
        {PRODUCT_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {/* List */}
      <section className="mt-4 flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasProducts={!!products && products.length > 0} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((p) => {
              const lowStock = p.stock_quantity <= p.low_stock_threshold;
              return (
                <li key={p.id}>
                  <Link
                    to="/products/$productId"
                    params={{ productId: p.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <ProductImage path={p.image_url} alt={p.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {p.category && <span className="truncate">{p.category}</span>}
                        {p.category && <span>·</span>}
                        <span
                          className={
                            lowStock
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {p.stock_quantity} in stock
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(p.selling_price)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* FAB */}
      <Link
        to="/products/new"
        aria-label="Add product"
        className="fixed bottom-24 right-[max(1.25rem,calc(50vw-13rem))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevation-3 transition-transform hover:scale-105 active:scale-95 sm:bottom-28"
      >
        <Plus className="h-6 w-6" strokeWidth={2.6} />
      </Link>

      <BottomNav />
    </MobileShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ hasProducts }: { hasProducts: boolean }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
        <Boxes className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        {hasProducts ? "No matches" : "No products yet"}
      </h3>
      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
        {hasProducts
          ? "Try a different search or category filter."
          : "Add your first product to start managing your inventory."}
      </p>
      {!hasProducts && (
        <Button asChild className="mt-4 h-10 rounded-xl">
          <Link to="/products/new">
            <PackagePlus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      )}
    </div>
  );
}
