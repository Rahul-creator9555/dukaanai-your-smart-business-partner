import { createServerFn } from "@tanstack/react-start";
import { PRODUCT_CATEGORIES } from "@/lib/products";

export interface RecogniseInput {
  barcode?: string | null;
  barcodeFormat?: string | null;
  /** Optional base64 data URL of a camera frame / uploaded photo. */
  imageDataUrl?: string | null;
  /** Optional user hint (product name). */
  name?: string | null;
}

export interface RecognisedProduct {
  title: string;
  brand: string;
  description: string;
  category: string;
  tags: string[];
  suggestedPrice: number;
  confidence: "high" | "medium" | "low";
}

const SYSTEM = `You identify retail products for a small Indian shop owner.
You get a product barcode (often GS1 India, prefix 890) and/or a photo of the package.
Identify the ACTUAL product: real brand, real variant, real pack size (e.g. "Patanjali Dant Kanti Toothpaste 100g").
Write a short shopkeeper-friendly description (max 220 chars) and 4-6 lowercase tags.
Suggest a realistic Indian retail MRP in rupees (number only).
Pick category from: ${PRODUCT_CATEGORIES.join(", ")}.
Never invent a title like "Product 12345". If you truly cannot identify it, set confidence "low" and use a generic but sensible title based on the photo.
Return ONLY JSON: {"title","brand","description","category","tags":[],"suggestedPrice",confidence:"high"|"medium"|"low"}`;

export const recogniseProduct = createServerFn({ method: "POST" })
  .inputValidator((input: RecogniseInput) => input)
  .handler(async ({ data }): Promise<RecognisedProduct> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const parts: Array<Record<string, unknown>> = [];
    const facts = [
      data.barcode ? `Barcode: ${data.barcode}` : null,
      data.barcodeFormat ? `Barcode format: ${data.barcodeFormat}` : null,
      data.name ? `Shopkeeper says the product is: ${data.name}` : null,
    ].filter(Boolean);
    parts.push({
      type: "text",
      text: facts.length ? facts.join("\n") : "Identify the product in the photo.",
    });
    if (data.imageDataUrl?.startsWith("data:image")) {
      parts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.6-terra",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: parts },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI is busy right now. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<RecognisedProduct> = {};
    try {
      parsed = JSON.parse(raw) as Partial<RecognisedProduct>;
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]) as Partial<RecognisedProduct>;
    }

    const category = (PRODUCT_CATEGORIES as readonly string[]).includes(
      String(parsed.category),
    )
      ? String(parsed.category)
      : "Other";

    return {
      title: (parsed.title || data.name || "Unknown product").toString().slice(0, 120),
      brand: (parsed.brand || "").toString(),
      description: (parsed.description || "").toString(),
      category,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 6) : [],
      suggestedPrice: Number(parsed.suggestedPrice) > 0 ? Number(parsed.suggestedPrice) : 0,
      confidence:
        parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low",
    };
  });
