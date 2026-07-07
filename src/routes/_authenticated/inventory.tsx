import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CalendarClock,
  IndianRupee,
  PackagePlus,
  PackageX,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ProductImage } from "@/components/ProductImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import {
  PRODUCT_CATEGORIES,
  computeInventoryStats,
  daysUntil,
  fetchProducts,
  formatCurrency,
  getStockStatus,
  productsKeys,
  type Product,
  type StockStatus,
} from "@/lib/products";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — DukaanAI" }] }),
  component: InventoryPage,
});

type Tab = "all" | "low" | "out" | "expiring";

const TAB_IDS: Tab[] = ["all", "low", "out", "expiring"];
const TAB_KEY: Record<Tab, string> = {
  all: "inv.tab.all",
  low: "inv.tab.low",
  out: "inv.tab.out",
  expiring: "inv.tab.expiring",
};

function InventoryPage() {
  const navigate = useNavigate();
  const t = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: productsKeys.list(),
    queryFn: fetchProducts,
  });

  const list = products ?? [];
  const stats = useMemo(() => computeInventoryStats(list), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (category && p.category !== category) return false;
      const status = getStockStatus(p);
      if (tab === "low" && status !== "low") return false;
      if (tab === "out" && status !== "out") return false;
      if (tab === "expiring" && status !== "expiring" && status !== "expired") return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, query, category, tab]);

  const chartData = useMemo(() => {
    const map = new Map<string, { category: string; units: number; value: number }>();
    for (const p of list) {
      const key = p.category ?? "Other";
      const entry = map.get(key) ?? { category: key, units: 0, value: 0 };
      entry.units += p.stock_quantity;
      entry.value += Number(p.purchase_price) * p.stock_quantity;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [list]);

  const healthData = useMemo(() => {
    const healthy = Math.max(
      stats.totalSkus - stats.lowCount - stats.outCount - stats.expiringCount - stats.expiredCount,
      0,
    );
    return [
      { name: "Healthy", value: healthy, color: "hsl(142 71% 45%)" },
      { name: "Low", value: stats.lowCount, color: "hsl(38 92% 50%)" },
      { name: "Out", value: stats.outCount, color: "hsl(0 84% 60%)" },
      { name: "Expiring", value: stats.expiringCount + stats.expiredCount, color: "hsl(24 95% 53%)" },
    ].filter((d) => d.value > 0);
  }, [stats]);

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
            <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
            <p className="text-xs text-muted-foreground">
              {stats.totalSkus} SKU{stats.totalSkus === 1 ? "" : "s"} · {stats.totalUnits} units
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

      {/* Stat cards */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Stock value"
          value={formatCurrency(stats.inventoryValue)}
          tone="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Potential revenue"
          value={formatCurrency(stats.potentialRevenue)}
          tone="success"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low stock"
          value={String(stats.lowCount)}
          tone="warning"
          onClick={() => setTab("low")}
        />
        <StatCard
          icon={<PackageX className="h-4 w-4" />}
          label="Out of stock"
          value={String(stats.outCount)}
          tone="danger"
          onClick={() => setTab("out")}
        />
      </section>

      {/* Charts */}
      {list.length > 0 && (
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Stock value by category</p>
            </div>
            <div className="mt-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
            <p className="text-xs font-medium text-muted-foreground">Stock health</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData.length ? healthData : [{ name: "None", value: 1, color: "hsl(var(--muted))" }]}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(healthData.length ? healthData : [{ color: "hsl(var(--muted))" }]).map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-xs">
                {healthData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}
                    </span>
                    <span className="font-semibold tabular-nums">{d.value}</span>
                  </li>
                ))}
                {healthData.length === 0 && (
                  <li className="text-muted-foreground">No data yet</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const count =
            t.id === "low"
              ? stats.lowCount
              : t.id === "out"
                ? stats.outCount
                : t.id === "expiring"
                  ? stats.expiringCount + stats.expiredCount
                  : stats.totalSkus;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  active ? "bg-primary-foreground/20" : "bg-secondary"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKU"
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
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`grid h-11 w-11 place-items-center rounded-2xl border transition-colors ${
            showFilters || category
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active={!category} onClick={() => setCategory(null)}>
            All categories
          </Chip>
          {PRODUCT_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      {/* List */}
      <section className="mt-4 flex-1 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasProducts={list.length > 0} tab={tab} />
        ) : (
          <ul className="space-y-2">
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </ul>
        )}
      </section>

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

function ProductRow({ product: p }: { product: Product }) {
  const status = getStockStatus(p);
  const days = daysUntil(p.expiry_date);
  return (
    <li>
      <Link
        to="/products/$productId"
        params={{ productId: p.id }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <ProductImage path={p.image_url} alt={p.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {p.category && <span className="truncate">{p.category}</span>}
            {p.category && <span>·</span>}
            <span>{p.stock_quantity} in stock</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <StatusBadge status={status} />
            {days !== null && (status === "expiring" || status === "expired") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
                <CalendarClock className="h-3 w-3" />
                {days < 0 ? `Expired ${-days}d ago` : `${days}d left`}
              </span>
            )}
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
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "ok") return null;
  const styles: Record<Exclude<StockStatus, "ok">, string> = {
    out: "bg-red-500/10 text-red-600 dark:text-red-400",
    low: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    expiring: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    expired: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  const label: Record<Exclude<StockStatus, "ok">, string> = {
    out: "Out of stock",
    low: "Low stock",
    expiring: "Expiring soon",
    expired: "Expired",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
    >
      {label[status]}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneStyles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  }[tone];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${toneStyles}`}>{icon}</span>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </Comp>
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

function EmptyState({ hasProducts, tab }: { hasProducts: boolean; tab: Tab }) {
  const messages: Record<Tab, { title: string; hint: string }> = {
    all: {
      title: hasProducts ? "No matches" : "No products yet",
      hint: hasProducts
        ? "Try a different search or category filter."
        : "Add your first product to start tracking inventory.",
    },
    low: { title: "Nothing running low", hint: "Products near their threshold will show up here." },
    out: { title: "All stocked up", hint: "Sold-out items will appear here." },
    expiring: { title: "No expiries coming up", hint: "Products expiring within 30 days will list here." },
  };
  const m = messages[tab];
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Boxes className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{m.title}</h3>
      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">{m.hint}</p>
      {!hasProducts && tab === "all" && (
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
