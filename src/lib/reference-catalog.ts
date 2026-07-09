// Mock "global catalog" of reference products retailers can match against.
// In production this would be a real product-master service; for now the
// entries are hand-curated with stable image URLs so the exact-match flow
// can copy image, description, tags, and suggested price straight to Shopify.

export interface ReferenceProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  tags: string[];
  suggestedPrice: number;
  currency: string;
  imageUrl: string;
  barcode?: string;
  unit?: string;
}

export const REFERENCE_CATALOG: ReferenceProduct[] = [
  {
    id: "ref-dove-soap-100",
    title: "Dove Cream Beauty Bathing Bar 100g",
    brand: "Dove",
    category: "Cosmetics",
    description:
      "Dove Cream Beauty Bathing Bar with 1/4 moisturising cream. Gently cleanses and cares for dry skin, leaving it soft, smooth and glowing.",
    tags: ["soap", "bathing bar", "dove", "skincare", "moisturising"],
    suggestedPrice: 65,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=600&q=80",
    barcode: "8901030475283",
    unit: "100 g",
  },
  {
    id: "ref-maggi-70",
    title: "Maggi 2-Minute Masala Noodles 70g",
    brand: "Nestlé",
    category: "Grocery",
    description:
      "India's favourite instant noodles with the classic Masala Tastemaker. Ready in just 2 minutes — a quick, tasty snack for any time of day.",
    tags: ["noodles", "maggi", "instant", "snack", "masala"],
    suggestedPrice: 14,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80",
    barcode: "8901058851212",
    unit: "70 g",
  },
  {
    id: "ref-amul-milk-1l",
    title: "Amul Taaza Toned Milk 1L",
    brand: "Amul",
    category: "Grocery",
    description:
      "Amul Taaza toned fresh milk in a tetra pack. Rich, creamy and hygienically packed for everyday nutrition.",
    tags: ["milk", "amul", "dairy", "toned", "tetra pack"],
    suggestedPrice: 74,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    barcode: "8901030826801",
    unit: "1 L",
  },
  {
    id: "ref-parle-g-800",
    title: "Parle-G Original Glucose Biscuits 800g",
    brand: "Parle",
    category: "Grocery",
    description:
      "The original G for Genius. Wholesome glucose biscuits with the goodness of milk and wheat — a timeless family favourite.",
    tags: ["biscuits", "parle", "glucose", "snack", "family pack"],
    suggestedPrice: 80,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
    barcode: "8901719101540",
    unit: "800 g",
  },
  {
    id: "ref-colgate-strong-teeth-200",
    title: "Colgate Strong Teeth Toothpaste 200g",
    brand: "Colgate",
    category: "Personal Care",
    description:
      "Colgate Strong Teeth with Amino Shakti — India's No.1 toothpaste for strong teeth. Fights cavities and builds strong enamel.",
    tags: ["toothpaste", "colgate", "oral care", "cavity protection"],
    suggestedPrice: 130,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80",
    barcode: "8901314010113",
    unit: "200 g",
  },
  {
    id: "ref-tata-salt-1kg",
    title: "Tata Salt Iodised 1kg",
    brand: "Tata",
    category: "Grocery",
    description:
      "Desh ka Namak. Vacuum-evaporated, iodised salt from Tata — the trusted choice for pure, everyday cooking.",
    tags: ["salt", "tata", "iodised", "cooking essentials"],
    suggestedPrice: 28,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1518110925495-b37653d2b8b7?auto=format&fit=crop&w=600&q=80",
    barcode: "8901725111007",
    unit: "1 kg",
  },
  {
    id: "ref-surf-excel-1kg",
    title: "Surf Excel Easy Wash Detergent Powder 1kg",
    brand: "Surf Excel",
    category: "Household",
    description:
      "Surf Excel Easy Wash removes tough stains easily so kids can play freely. Gentle on hands, tough on stains.",
    tags: ["detergent", "surf excel", "laundry", "washing powder"],
    suggestedPrice: 165,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80",
    barcode: "8901030686870",
    unit: "1 kg",
  },
  {
    id: "ref-lays-classic-52",
    title: "Lay's Classic Salted Potato Chips 52g",
    brand: "Lay's",
    category: "Snacks",
    description:
      "Crispy, golden potato chips with just the right pinch of salt. The classic Lay's crunch everyone loves.",
    tags: ["chips", "lays", "snacks", "salted", "potato"],
    suggestedPrice: 20,
    currency: "INR",
    imageUrl:
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=600&q=80",
    barcode: "8901491101653",
    unit: "52 g",
  },
];

export function searchReferenceCatalog(query: string): ReferenceProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return REFERENCE_CATALOG.filter((p) => {
    const hay = [p.title, p.brand, p.category, ...p.tags].join(" ").toLowerCase();
    return hay.includes(q);
  }).slice(0, 12);
}

export function getReferenceProduct(id: string): ReferenceProduct | undefined {
  return REFERENCE_CATALOG.find((p) => p.id === id);
}
