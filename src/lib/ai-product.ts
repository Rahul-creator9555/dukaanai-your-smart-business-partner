import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/products";

export interface AIGeneratedProduct {
  title: string;
  description: string;
  category: ProductCategory;
  tags: string[];
  suggestedPrice: number;
}

export interface GenerateInput {
  /** Optional product name / hint from the user. */
  name?: string;
  /** Optional uploaded image. */
  image?: File | null;
  /** Optional scanned QR / barcode value (EAN, UPC, QR URL, etc.). */
  barcode?: string | null;
  /** Optional detected barcode format (e.g. "ean_13", "qr_code"). */
  barcodeFormat?: string | null;
}

/**
 * Clean seam for AI product generation.
 *
 * Today this returns a deterministic mock so the UI is fully testable.
 * Swap the body for a real model call (e.g. Lovable AI Gateway vision +
 * chat completion) without touching the screen — keep the signature.
 */
export async function generateProductDetails(
  input: GenerateInput,
): Promise<AIGeneratedProduct> {
  await delay(1400 + Math.random() * 900);

  const hint = (input.name ?? "").trim();
  const fromImage = !hint && !!input.image
    ? humanizeFileName(input.image.name)
    : "";
  const fromBarcode = !hint && !fromImage && input.barcode
    ? humanizeBarcode(input.barcode)
    : "";
  const seed = hint || fromImage || fromBarcode || "New product";

  const category = inferCategory(seed);
  const price = suggestPrice(category, seed);
  const tags = buildTags(seed, category);
  if (input.barcode) tags.push(`code:${input.barcode.slice(0, 20)}`);

  return {
    title: toTitleCase(seed),
    description: buildDescription(seed, category, input.barcode ?? null),
    category,
    tags: Array.from(new Set(tags)).slice(0, 8),
    suggestedPrice: price,
  };
}

function humanizeBarcode(code: string) {
  try {
    const u = new URL(code);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) return seg.replace(/[-_]+/g, " ");
    return u.hostname.replace(/^www\./, "");
  } catch {
    return `Product ${code.slice(-6)}`;
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function humanizeFileName(name: string) {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  Medical: ["tablet", "syrup", "medicine", "balm", "ointment", "paracet", "vitamin", "mask"],
  Grocery: ["rice", "dal", "atta", "flour", "oil", "sugar", "salt", "tea", "biscuit", "milk", "snack"],
  Clothing: ["shirt", "tshirt", "t-shirt", "jeans", "kurta", "saree", "dress", "jacket", "shoe"],
  Electronics: ["phone", "charger", "cable", "earbud", "headphone", "battery", "bulb", "speaker", "led"],
  Cosmetics: ["cream", "lotion", "lipstick", "shampoo", "soap", "face", "perfume", "kajal"],
  Hardware: ["screw", "nail", "drill", "hammer", "pipe", "wire", "tape", "paint", "tool"],
  Stationery: ["pen", "pencil", "notebook", "paper", "marker", "eraser", "file", "stapler"],
  Other: [],
};

function inferCategory(seed: string): ProductCategory {
  const lower = seed.toLowerCase();
  for (const cat of PRODUCT_CATEGORIES) {
    if (cat === "Other") continue;
    if (CATEGORY_KEYWORDS[cat].some((k) => lower.includes(k))) return cat;
  }
  return "Grocery";
}

function suggestPrice(category: ProductCategory, seed: string): number {
  const base: Record<ProductCategory, number> = {
    Medical: 80,
    Grocery: 120,
    Clothing: 599,
    Electronics: 899,
    Cosmetics: 199,
    Hardware: 249,
    Stationery: 49,
    Other: 149,
  };
  const jitter = (hash(seed) % 50) - 10;
  return Math.max(10, Math.round((base[category] + jitter) / 5) * 5);
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildDescription(seed: string, category: ProductCategory, barcode: string | null = null) {
  const title = toTitleCase(seed);
  const blurbs: Record<ProductCategory, string> = {
    Medical: `${title} — trusted everyday care for your customers. Store in a cool, dry place.`,
    Grocery: `${title} — fresh, high-quality stock perfect for daily kitchen needs.`,
    Clothing: `${title} — comfortable fit and modern look, made for everyday wear.`,
    Electronics: `${title} — reliable performance with a clean, durable design.`,
    Cosmetics: `${title} — gentle, skin-friendly formula for a refreshed look.`,
    Hardware: `${title} — sturdy build that handles tough daily jobs with ease.`,
    Stationery: `${title} — smooth, dependable quality for school and office.`,
    Other: `${title} — a great addition to your shop's catalogue.`,
  };
  const base = blurbs[category];
  return barcode ? `${base} Scanned code: ${barcode}.` : base;
}

function buildTags(seed: string, category: ProductCategory): string[] {
  const base = seed
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const extras: Record<ProductCategory, string[]> = {
    Medical: ["healthcare", "wellness"],
    Grocery: ["daily", "kitchen"],
    Clothing: ["fashion", "apparel"],
    Electronics: ["gadget", "tech"],
    Cosmetics: ["beauty", "skincare"],
    Hardware: ["tools", "diy"],
    Stationery: ["office", "school"],
    Other: ["popular"],
  };
  return Array.from(new Set([...base, category.toLowerCase(), ...extras[category]])).slice(0, 6);
}
