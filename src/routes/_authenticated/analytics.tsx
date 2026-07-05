import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  IndianRupee,
  Lightbulb,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { ProductImage } from "@/components/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts, formatCurrency, productsKeys } from "@/lib/products";
import { computeAnalytics, type ProductMovement } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DukaanAI" },
      { name: "description", content: "Sales, inventory, and product performance insights for your shop." },
    ],
  }),
  component: AnalyticsPage,
});

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useQuery({
    queryKey: productsKeys.list(),
    queryFn: fetchProducts,
  });

  const analytics = useMemo(() => computeAnalytics(products ?? []), [products]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between animate-fade-in">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-[11px] text-muted-foreground">Last 14 days · Demo data</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container text-on-primary-container">
          <BarChart3 className="h-4 w-4" />
        </span>
      </header>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <section className="mt-5 grid grid-cols-2 gap-3">
            <KpiCard
              label="Total sales"
              value={formatCurrency(analytics.totalSales)}
              trend={analytics.salesTrendPct}
              icon={<IndianRupee className="h-4 w-4" />}
              tone="primary"
            />
            <KpiCard
              label="Orders"
              value={analytics.totalOrders.toLocaleString("en-IN")}
              trend={analytics.ordersTrendPct}
              icon={<ShoppingBag className="h-4 w-4" />}
              tone="accent"
            />
            <KpiCard
              label="Gross profit"
              value={formatCurrency(analytics.grossProfit)}
              trend={analytics.profitTrendPct}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="success"
            />
            <KpiCard
              label="Avg. order value"
              value={formatCurrency(analytics.avgOrderValue)}
              icon={<Sparkles className="h-4 w-4" />}
              tone="warning"
            />
          </section>

          {/* Sales overview */}
          <Card
            title="Sales overview"
            subtitle="Revenue trend over the last 14 days"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailySales} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Inventory value */}
          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-[oklch(0.40_0.18_265)] p-5 text-primary-foreground shadow-elevation-2">
              <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/80">
                <Boxes className="h-3.5 w-3.5" /> Inventory value
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatCurrency(analytics.inventoryValue)}
              </p>
              <p className="mt-1 text-[11px] text-primary-foreground/85">
                Potential revenue {formatCurrency(analytics.potentialRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-elevation-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Active SKUs
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {(products?.length ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Across {analytics.categorySales.length} categories
              </p>
            </div>
          </section>

          {/* Category performance */}
          {analytics.categorySales.length > 0 && (
            <Card
              title="Sales by category"
              subtitle="Where your revenue comes from"
              icon={<BarChart3 className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categorySales}
                        dataKey="sales"
                        nameKey="category"
                        innerRadius={42}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {analytics.categorySales.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-2 self-center text-xs">
                  {analytics.categorySales.map((c, i) => {
                    const pct = Math.round((c.sales / Math.max(1, analytics.totalSales)) * 100);
                    return (
                      <li key={c.category} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                          />
                          <span className="truncate font-medium">{c.category}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          )}

          {/* Orders trend */}
          <Card
            title="Order volume"
            subtitle="Daily orders placed"
            icon={<ShoppingBag className="h-4 w-4" />}
          >
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailySales} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Fast moving */}
          <Card
            title="Fast moving products"
            subtitle="Selling the fastest right now"
            icon={<Zap className="h-4 w-4" />}
            action={
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                Restock priority
              </span>
            }
          >
            <MovementList items={analytics.fastMoving} tone="up" />
          </Card>

          {/* Slow moving */}
          <Card
            title="Slow moving products"
            subtitle="Consider promotions or bundles"
            icon={<TrendingDown className="h-4 w-4" />}
            action={
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                Action needed
              </span>
            }
          >
            <MovementList items={analytics.slowMoving} tone="down" />
          </Card>

          {/* Product performance table */}
          <Card
            title="Top product performance"
            subtitle="By gross profit contribution"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="space-y-2">
              {analytics.topPerformers.map((m, i) => {
                const share = Math.max(
                  4,
                  Math.round((m.profit / Math.max(1, analytics.topPerformers[0].profit)) * 100),
                );
                return (
                  <div key={m.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container">
                          {i + 1}
                        </span>
                        <span className="truncate text-sm font-medium">{m.name}</span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatCurrency(m.profit)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{m.unitsSold} units · {m.category}</span>
                      <span className="tabular-nums">{formatCurrency(m.revenue)} revenue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Trend analysis */}
          <Card
            title="Trend analysis"
            subtitle="Change vs previous period"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...analytics.fastMoving, ...analytics.slowMoving.slice(0, 3)].map((m) => ({
                    name: m.name.length > 10 ? m.name.slice(0, 10) + "…" : m.name,
                    trend: m.trendPct,
                  }))}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                  <Line type="monotone" dataKey="trend" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Insights */}
          {analytics.insights.length > 0 && (
            <Card
              title="Business insights"
              subtitle="AI-generated suggestions"
              icon={<Lightbulb className="h-4 w-4" />}
            >
              <ul className="space-y-2">
                {analytics.insights.map((tip, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-primary-container/60 p-3 text-sm text-on-primary-container"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                to="/assistant"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-elevation-1 transition-transform hover:scale-[1.01]"
              >
                <Sparkles className="h-4 w-4" /> Ask AI Assistant
              </Link>
            </Card>
          )}
        </>
      )}

      <BottomNav />
    </MobileShell>
  );
}

function Card({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-elevation-1 animate-fade-in">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {icon && (
            <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-primary-container text-on-primary-container">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  trend,
  icon,
  tone,
}: {
  label: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "success" | "warning";
}) {
  const toneCls =
    tone === "success"
      ? "bg-green-50 text-green-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : tone === "accent"
          ? "bg-accent text-accent-foreground"
          : "bg-primary-container text-on-primary-container";
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${toneCls}`}>{icon}</span>
        {typeof trend === "number" && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-lg font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MovementList({ items, tone }: { items: ProductMovement[]; tone: "up" | "down" }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No data yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((m) => {
        const positive = m.trendPct >= 0;
        return (
          <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border">
              <ProductImage path={m.image_url} alt={m.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {m.velocity} units/day · {m.stock} in stock
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{m.unitsSold}</p>
              <p
                className={`text-[10px] font-medium ${
                  tone === "up"
                    ? positive
                      ? "text-green-700"
                      : "text-orange-700"
                    : "text-muted-foreground"
                }`}
              >
                {positive ? "+" : ""}
                {m.trendPct}%
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
