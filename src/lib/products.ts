import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export const PRODUCT_CATEGORIES = [
  "Medical",
  "Grocery",
  "Clothing",
  "Electronics",
  "Cosmetics",
  "Hardware",
  "Stationery",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_IMAGES_BUCKET = "product-images";

export const productsKeys = {
  all: ["products"] as const,
  list: () => [...productsKeys.all, "list"] as const,
  detail: (id: string) => [...productsKeys.all, "detail", id] as const,
  signedUrl: (path: string) => ["product-image", path] as const,
};

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function uploadProductImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteProductImage(path: string | null) {
  if (!path) return;
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}
