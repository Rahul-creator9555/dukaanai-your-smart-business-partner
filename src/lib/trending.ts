import type { ProductCategory } from "./products";

export type Demand = "Low" | "Medium" | "High" | "Very High";

export interface TrendingProduct {
  id: string;
  name: string;
  category: ProductCategory;
  image: string;
  trendScore: number; // 0-100
  demand: Demand;
  estimatedProfit: number; // INR per unit
  reason: string;
}

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=600&q=70`;

export const TRENDING_PRODUCTS: TrendingProduct[] = [
  // Medical
  { id: "m1", name: "Vitamin D3 60K Sachets", category: "Medical", image: img("photo-1587854692152-cbe660dbde88"), trendScore: 92, demand: "Very High", estimatedProfit: 45, reason: "Winter deficiency surge" },
  { id: "m2", name: "Digital Thermometer", category: "Medical", image: img("photo-1583947581924-860bda3c6f78"), trendScore: 78, demand: "High", estimatedProfit: 80, reason: "Seasonal flu spike" },
  { id: "m3", name: "Glucometer Strips (50)", category: "Medical", image: img("photo-1559757175-08f3a4b3f9e6"), trendScore: 71, demand: "High", estimatedProfit: 120, reason: "Repeat-buy diabetic care" },

  // Grocery
  { id: "g1", name: "A2 Cow Ghee 500ml", category: "Grocery", image: img("photo-1628689469838-524a4a973b8e"), trendScore: 88, demand: "Very High", estimatedProfit: 180, reason: "Premium kitchen trend" },
  { id: "g2", name: "Millet Atta 1kg", category: "Grocery", image: img("photo-1586201375761-83865001e31c"), trendScore: 81, demand: "High", estimatedProfit: 35, reason: "Healthy eating wave" },
  { id: "g3", name: "Cold-Pressed Coconut Oil", category: "Grocery", image: img("photo-1474979266404-7eaacbcd87c5"), trendScore: 69, demand: "Medium", estimatedProfit: 60, reason: "Organic shift" },

  // Clothing
  { id: "c1", name: "Oversized Cotton Tee", category: "Clothing", image: img("photo-1521572163474-6864f9cf17ab"), trendScore: 90, demand: "Very High", estimatedProfit: 220, reason: "Gen-Z fit favorite" },
  { id: "c2", name: "Linen Co-ord Set", category: "Clothing", image: img("photo-1490481651871-ab68de25d43d"), trendScore: 76, demand: "High", estimatedProfit: 350, reason: "Summer staple" },
  { id: "c3", name: "Cargo Joggers", category: "Clothing", image: img("photo-1473966968600-fa801b869a1a"), trendScore: 72, demand: "High", estimatedProfit: 280, reason: "Streetwear trend" },

  // Electronics
  { id: "e1", name: "Neckband Earphones", category: "Electronics", image: img("photo-1606220588913-b3aacb4d2f46"), trendScore: 86, demand: "Very High", estimatedProfit: 250, reason: "Budget audio surge" },
  { id: "e2", name: "65W GaN Charger", category: "Electronics", image: img("photo-1583863788434-e58a36330cf0"), trendScore: 79, demand: "High", estimatedProfit: 320, reason: "Fast-charge demand" },
  { id: "e3", name: "Smartwatch Strap 22mm", category: "Electronics", image: img("photo-1523275335684-37898b6baf30"), trendScore: 68, demand: "Medium", estimatedProfit: 90, reason: "Accessory upsell" },

  // Cosmetics
  { id: "cm1", name: "Vitamin C Serum 30ml", category: "Cosmetics", image: img("photo-1556228720-195a672e8a03"), trendScore: 94, demand: "Very High", estimatedProfit: 180, reason: "Viral skincare" },
  { id: "cm2", name: "SPF 50 Sunscreen", category: "Cosmetics", image: img("photo-1556228578-8c89e6adf883"), trendScore: 85, demand: "High", estimatedProfit: 140, reason: "Daily-use essential" },
  { id: "cm3", name: "Matte Lip Tint", category: "Cosmetics", image: img("photo-1522335789203-aaa30fb7497d"), trendScore: 73, demand: "High", estimatedProfit: 95, reason: "Reels-driven demand" },

  // Hardware
  { id: "h1", name: "Cordless Drill 12V", category: "Hardware", image: img("photo-1504148455328-c376907d081c"), trendScore: 80, demand: "High", estimatedProfit: 450, reason: "DIY weekend boom" },
  { id: "h2", name: "LED Panel Light 18W", category: "Hardware", image: img("photo-1565636192335-fe4b7d72e0ff"), trendScore: 70, demand: "Medium", estimatedProfit: 110, reason: "Home renovation" },
  { id: "h3", name: "Smart Door Lock", category: "Hardware", image: img("photo-1558002038-1055907df827"), trendScore: 66, demand: "Medium", estimatedProfit: 800, reason: "Smart-home upgrade" },

  // Stationery
  { id: "s1", name: "Gel Pens Pack of 10", category: "Stationery", image: img("photo-1455390582262-044cdead277a"), trendScore: 83, demand: "High", estimatedProfit: 40, reason: "Back-to-school" },
  { id: "s2", name: "A5 Dotted Notebook", category: "Stationery", image: img("photo-1531346878377-a5be20888e57"), trendScore: 74, demand: "High", estimatedProfit: 70, reason: "Journaling trend" },
  { id: "s3", name: "Sticky Notes Cube", category: "Stationery", image: img("photo-1606326608606-aa0b62935f2b"), trendScore: 65, demand: "Medium", estimatedProfit: 30, reason: "Office staple" },

  // Other / fallback
  { id: "o1", name: "Reusable Water Bottle", category: "Other", image: img("photo-1602143407151-7111542de6e8"), trendScore: 77, demand: "High", estimatedProfit: 120, reason: "Eco-friendly pick" },
  { id: "o2", name: "Cotton Tote Bag", category: "Other", image: img("photo-1591561954557-26941169b49e"), trendScore: 69, demand: "Medium", estimatedProfit: 65, reason: "Sustainable lifestyle" },
];

export function getTrendingForCategory(category: string | null | undefined): TrendingProduct[] {
  if (!category) return TRENDING_PRODUCTS.slice(0, 8);
  const matched = TRENDING_PRODUCTS.filter((p) => p.category === category);
  if (matched.length >= 3) return matched;
  // Pad with top trending from other categories
  const others = TRENDING_PRODUCTS.filter((p) => p.category !== category)
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 6 - matched.length);
  return [...matched, ...others];
}

export function demandTone(d: Demand): { bg: string; text: string; dot: string } {
  switch (d) {
    case "Very High":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "High":
      return { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" };
    case "Medium":
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  }
}
