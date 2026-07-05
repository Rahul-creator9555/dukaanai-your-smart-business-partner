import type { Product } from "./products";

export interface DailySales {
  date: string; // e.g. "Mon 01"
  sales: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  sales: number;
}

export interface ProductMovement {
  id: string;
  name: string;
  category: string;
  image_path: string | null;
  unitsSold: number;
  revenue: number;
  profit: number;
  stock: number;
  velocity: number; // units/day
  trendPct: number; // +/- change vs previous period
}

export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  grossProfit: number;
  salesTrendPct: number;
  ordersTrendPct: number;
  profitTrendPct: number;
  inventoryValue: number;
  potentialRevenue: number;
  dailySales: DailySales[];
  categorySales: CategorySales[];
  fastMoving: ProductMovement[];
  slowMoving: ProductMovement[];
  topPerformers: ProductMovement[];
  insights: string[];
}

// Deterministic pseudo-random so numbers stay stable per session
function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DAYS = 14;

export function computeAnalytics(products: Product[]): AnalyticsSummary {
  const rand = seeded(products.length * 137 + 7);

  // Ensure we have something to show even with empty inventory
  const source = products.length
    ? products
    : ([
        { id: "demo-1", name: "Sample Product A", category: "Grocery", image_path: null, stock_quantity: 40, low_stock_threshold: 5, purchase_price: 80, selling_price: 120, expiry_date: null } as unknown as Product,
        { id: "demo-2", name: "Sample Product B", category: "Cosmetics", image_path: null, stock_quantity: 15, low_stock_threshold: 5, purchase_price: 150, selling_price: 250, expiry_date: null } as unknown as Product,
        { id: "demo-3", name: "Sample Product C", category: "Electronics", image_path: null, stock_quantity: 8, low_stock_threshold: 3, purchase_price: 600, selling_price: 900, expiry_date: null } as unknown as Product,
      ]);

  // Simulate units sold per product over the window
  const movements: ProductMovement[] = source.map((p) => {
    const seed = hashString(p.id);
    const r = seeded(seed);
    // higher-margin, mid-priced items sell more; add randomness
    const base = 5 + Math.floor(r() * 60);
    const unitsSold = Math.max(0, base + Math.round((r() - 0.4) * 30));
    const revenue = unitsSold * Number(p.selling_price);
    const profit = unitsSold * (Number(p.selling_price) - Number(p.purchase_price));
    const velocity = +(unitsSold / DAYS).toFixed(2);
    const trendPct = Math.round((r() - 0.4) * 60);
    return {
      id: p.id,
      name: p.name,
      category: p.category ?? "Other",
      image_path: p.image_path ?? null,
      unitsSold,
      revenue,
      profit,
      stock: p.stock_quantity,
      velocity,
      trendPct,
    };
  });

  const totalSales = movements.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = Math.max(1, Math.round(movements.reduce((s, m) => s + m.unitsSold, 0) / 2.3));
  const grossProfit = movements.reduce((s, m) => s + m.profit, 0);
  const avgOrderValue = totalSales / totalOrders;

  // Daily sales (last 14 days)
  const dailySales: DailySales[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const weight = 0.6 + rand() * 0.9;
    const sales = Math.round((totalSales / DAYS) * weight);
    const orders = Math.max(1, Math.round((totalOrders / DAYS) * weight));
    dailySales.push({
      date: d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
      sales,
      orders,
    });
  }

  // Category sales
  const byCat = new Map<string, number>();
  for (const m of movements) {
    byCat.set(m.category, (byCat.get(m.category) ?? 0) + m.revenue);
  }
  const categorySales: CategorySales[] = [...byCat.entries()]
    .map(([category, sales]) => ({ category, sales }))
    .sort((a, b) => b.sales - a.sales);

  const sortedByVelocity = [...movements].sort((a, b) => b.velocity - a.velocity);
  const fastMoving = sortedByVelocity.slice(0, 5);
  const slowMoving = [...movements]
    .filter((m) => m.stock > 0)
    .sort((a, b) => a.velocity - b.velocity)
    .slice(0, 5);
  const topPerformers = [...movements].sort((a, b) => b.profit - a.profit).slice(0, 5);

  const inventoryValue = source.reduce((s, p) => s + Number(p.purchase_price) * p.stock_quantity, 0);
  const potentialRevenue = source.reduce((s, p) => s + Number(p.selling_price) * p.stock_quantity, 0);

  const insights: string[] = [];
  if (fastMoving[0]) {
    insights.push(
      `⚡ ${fastMoving[0].name} is your fastest mover at ${fastMoving[0].velocity} units/day — consider restocking.`,
    );
  }
  if (slowMoving[0] && slowMoving[0].velocity < 1) {
    insights.push(
      `🐢 ${slowMoving[0].name} has sold only ${slowMoving[0].unitsSold} units in ${DAYS} days. Try a promo or bundle.`,
    );
  }
  if (categorySales[0]) {
    insights.push(
      `🏆 ${categorySales[0].category} is your best-selling category — it drove ${Math.round(
        (categorySales[0].sales / Math.max(1, totalSales)) * 100,
      )}% of revenue.`,
    );
  }
  if (grossProfit > 0) {
    insights.push(
      `💰 Estimated gross margin is ${Math.round((grossProfit / Math.max(1, totalSales)) * 100)}% across ${
        movements.length
      } SKUs.`,
    );
  }

  return {
    totalSales,
    totalOrders,
    avgOrderValue,
    grossProfit,
    salesTrendPct: Math.round((rand() - 0.3) * 40),
    ordersTrendPct: Math.round((rand() - 0.3) * 40),
    profitTrendPct: Math.round((rand() - 0.3) * 40),
    inventoryValue,
    potentialRevenue,
    dailySales,
    categorySales,
    fastMoving,
    slowMoving,
    topPerformers,
    insights,
  };
}
