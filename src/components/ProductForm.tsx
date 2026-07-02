import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  PRODUCT_CATEGORIES,
  deleteProductImage,
  getProductImageUrl,
  productsKeys,
  uploadProductImage,
  type Product,
} from "@/lib/products";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initial?: Product;
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(60).optional(),
  stock_quantity: z.number().int().min(0).max(1_000_000),
  purchase_price: z.number().min(0).max(10_000_000),
  selling_price: z.number().min(0).max(10_000_000),
  low_stock_threshold: z.number().int().min(0).max(1_000_000),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export function ProductForm({ mode, initial }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0));
  const [purchase, setPurchase] = useState(String(initial?.purchase_price ?? ""));
  const [selling, setSelling] = useState(String(initial?.selling_price ?? ""));
  const [lowStock, setLowStock] = useState(String(initial?.low_stock_threshold ?? 5));
  const [expiry, setExpiry] = useState(initial?.expiry_date ?? "");

  const [imagePath, setImagePath] = useState<string | null>(initial?.image_url ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    if (imagePath) {
      getProductImageUrl(imagePath).then((u) => {
        if (alive) setPreviewUrl(u);
      });
    } else {
      setPreviewUrl(null);
    }
    return () => {
      alive = false;
    };
  }, [pendingFile, imagePath]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name,
        description: description || undefined,
        category: category || undefined,
        sku: sku || undefined,
        stock_quantity: Number(stock || 0),
        purchase_price: Number(purchase || 0),
        selling_price: Number(selling || 0),
        low_stock_threshold: Number(lowStock || 0),
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid data");
      }

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Not signed in");

      let nextPath = imagePath;
      if (pendingFile) {
        nextPath = await uploadProductImage(user.id, pendingFile);
        if (mode === "edit" && initial?.image_url && initial.image_url !== nextPath) {
          await deleteProductImage(initial.image_url);
        }
      }

      const payload = {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        category: parsed.data.category ?? null,
        sku: parsed.data.sku ?? null,
        stock_quantity: parsed.data.stock_quantity,
        purchase_price: parsed.data.purchase_price,
        selling_price: parsed.data.selling_price,
        low_stock_threshold: parsed.data.low_stock_threshold,
        image_url: nextPath,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("products")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", initial!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (product) => {
      toast.success(mode === "create" ? "Product added" : "Product updated");
      qc.invalidateQueries({ queryKey: productsKeys.all });
      navigate({ to: "/products/$productId", params: { productId: product.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setPendingFile(file);
  };

  const removeImage = () => {
    setPendingFile(null);
    setImagePath(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="-mx-6 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate({ to: "/inventory" })}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold tracking-tight">
          {mode === "create" ? "New product" : "Edit product"}
        </h1>
      </header>

      <form
        className="mt-5 space-y-6 pb-28"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {/* Image */}
        <section>
          <Label className="text-xs font-medium text-muted-foreground">Image</Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-secondary">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                  <Camera className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                {previewUrl ? "Replace" : "Upload"}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={removeImage}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
            </div>
          </div>
        </section>

        {/* Basics */}
        <section className="space-y-3">
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dove Soap 100g"
              className="h-11 rounded-xl"
              maxLength={120}
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
              maxLength={2000}
              className="rounded-xl"
            />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(active ? "" : c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="SKU / Barcode">
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-xl"
              maxLength={60}
            />
          </Field>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-sm font-semibold tracking-tight">Pricing</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Purchase price">
              <Input
                value={purchase}
                onChange={(e) => setPurchase(e.target.value)}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Selling price">
              <Input
                value={selling}
                onChange={(e) => setSelling(e.target.value)}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
        </section>

        {/* Inventory */}
        <section>
          <h2 className="text-sm font-semibold tracking-tight">Inventory</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Stock quantity">
              <Input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Low-stock alert">
              <Input
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="5"
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 backdrop-blur sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-b-3xl">
          <Button
            type="submit"
            disabled={save.isPending}
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            {save.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : mode === "create" ? (
              "Add product"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
