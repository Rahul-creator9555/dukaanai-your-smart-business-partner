import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Flame, Plus, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CATEGORIES, formatCurrency } from "@/lib/products";
import {
  TRENDING_PRODUCTS,
  demandTone,
  getTrendingForCategory,
  type TrendingProduct,
} from "@/lib/trending";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => ({ meta: [{ title: "Trending Products — DukaanAI" }] }),
  component: TrendsPage,
});

type Action = "have" | "added" | "ignored";

function TrendsPage() {
  const navigate = useNavigate();
  const [shopCategory, setShopCategory] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [actions, setActions] = useState<Record<string, Action>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("shop_category")
        .eq("id", u.user.id)
        .maybeSingle();
      if (!mounted) return;
      const cat = data?.shop_category ?? null;
      setShopCategory(cat);
      setActiveCategory(cat ?? "All");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const products = useMemo(() => {
    if (activeCategory === "All") {
      return [...TRENDING_PRODUCTS].sort((a, b) => b.trendScore - a.trendScore);
    }
    return getTrendingForCategory(activeCategory).sort(
      (a, b) => b.trendScore - a.trendScore,
    );
  }, [activeCategory]);

  const visible = products.filter((p) => actions[p.id] !== "ignored");

  function handleAction(p: TrendingProduct, action: Action) {
    setActions((s) => ({ ...s, [p.id]: action }));
    if (action === "have") toast.success(`Marked "${p.name}" as in stock`);
    if (action === "ignored") toast(`Ignored "${p.name}"`);
    if (action === "added") {
      toast.success("Opening add product…");
      navigate({ to: "/products/new" });
    }
  }

  const chips = ["All", ...PRODUCT_CATEGORIES];

  return (
    <MobileShell>
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-tight">Trending</h1>
          {shopCategory && (
            <p className="text-[11px] text-muted-foreground">For {shopCategory} stores</p>
          )}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container text-on-primary-container">
          <TrendingUp className="h-4 w-4" />
        </span>
      </header>

      {/* Category chips */}
      <div className="-mx-6 mt-5 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {chips.map((c) => {
            const active = activeCategory === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-elevation-1"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-5 space-y-4 pb-4">
        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">No trending products to show.</p>
          </div>
        ) : (
          visible.map((p) => (
            <TrendCard
              key={p.id}
              product={p}
              status={actions[p.id]}
              onAction={(a) => handleAction(p, a)}
            />
          ))
        )}
      </section>

      <BottomNav />
    </MobileShell>
  );
}

function TrendCard({
  product,
  status,
  onAction,
}: {
  product: TrendingProduct;
  status?: Action;
  onAction: (a: Action) => void;
}) {
  const tone = demandTone(product.demand);
  const isHave = status === "have";
  const isAdded = status === "added";

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevation-1 transition hover:shadow-elevation-2 animate-fade-in">
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Flame className="h-3 w-3 text-orange-400" />
          {product.trendScore}
        </div>
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.bg} ${tone.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {product.demand}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {product.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {product.category} · {product.reason}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Est. profit
            </p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(product.estimatedProfit)}
            </p>
          </div>
        </div>

        {/* Trend score bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Trend score</span>
            <span className="font-semibold text-foreground">{product.trendScore}/100</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all"
              style={{ width: `${product.trendScore}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => onAction("have")}
            disabled={isHave}
            className={`flex items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-[11px] font-semibold transition ${
              isHave
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {isHave ? "In stock" : "I have this"}
          </button>
          <button
            onClick={() => onAction("added")}
            disabled={isAdded}
            className="flex items-center justify-center gap-1 rounded-2xl bg-primary px-2 py-2.5 text-[11px] font-semibold text-primary-foreground shadow-elevation-1 transition hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            onClick={() => onAction("ignored")}
            className="flex items-center justify-center gap-1 rounded-2xl border border-border bg-card px-2 py-2.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
            Ignore
          </button>
        </div>
      </div>
    </article>
  );
}
