import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_STORE_DOMAIN =
  "dukaanai-your-smart-business-partner-v52oz.myshopify.com";
const SHOPIFY_API_VERSION = "2025-07";

const ListingInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().default(""),
  price: z.number().min(0).max(10_000_000),
  currency: z.string().trim().max(6).optional().default("INR"),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(30).optional().default([]),
  category: z.string().trim().max(80).optional().default(""),
  vendor: z.string().trim().max(120).optional().default(""),
  sku: z.string().trim().max(80).optional().default(""),
  stock: z.number().int().min(0).max(1_000_000).optional().default(1),
  address: z.string().trim().max(500).optional().default(""),
});

export type ListingInput = z.infer<typeof ListingInput>;

export const listProductOnShopify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ListingInput.parse(data))
  .handler(async ({ data }) => {
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "Shopify Admin API token is not configured on the server."
      );
    }

    const descriptionHtml = [
      data.description
        ? `<p>${escapeHtml(data.description)}</p>`
        : "",
      data.address
        ? `<p><strong>Sold by:</strong> ${escapeHtml(data.address)}</p>`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      product: {
        title: data.title,
        body_html: descriptionHtml,
        vendor: data.vendor || undefined,
        product_type: data.category || undefined,
        tags: (data.tags ?? []).join(", "),
        status: "active",
        images: data.imageUrl ? [{ src: data.imageUrl }] : [],
        variants: [
          {
            price: data.price.toFixed(2),
            sku: data.sku || undefined,
            inventory_management: "shopify",
            inventory_quantity: data.stock,
          },
        ],
      },
    };

    const res = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`Shopify create failed [${res.status}]: ${body}`);
      throw new Error(
        `Shopify listing failed (${res.status}). ${truncate(body, 240)}`
      );
    }

    const json = (await res.json()) as {
      product: { id: number; handle: string; title: string };
    };
    return {
      id: json.product.id,
      handle: json.product.handle,
      title: json.product.title,
      adminUrl: `https://admin.shopify.com/store/dukaanai-your-smart-business-partner-v52oz/products/${json.product.id}`,
    };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
