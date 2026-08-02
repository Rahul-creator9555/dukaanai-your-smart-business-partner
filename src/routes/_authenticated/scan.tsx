import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  RotateCcw,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  PRODUCT_CATEGORIES,
  productsKeys,
  type ProductCategory,
} from "@/lib/products";
import { recogniseProduct } from "@/lib/ai-product.functions";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "Scan product code — DukaanAI" },
      {
        name: "description",
        content: "Scan a product QR or barcode and list it instantly with AI.",
      },
    ],
  }),
  component: ScanPage,
});

type Stage = "scanning" | "recognising" | "result" | "editing";

interface Draft {
  title: string;
  description: string;
  category: ProductCategory;
  tags: string[];
  suggestedPrice: number;
  stock: number;
  purchasePrice: number;
  confidence: "high" | "medium" | "low";
}

function ScanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const recognise = useServerFn(recogniseProduct);
  const [stage, setStage] = useState<Stage>("scanning");
  const [code, setCode] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [correction, setCorrection] = useState("");

  const runRecognition = useCallback(
    async (opts: {
      barcode?: string | null;
      barcodeFormat?: string | null;
      imageDataUrl?: string | null;
      name?: string | null;
    }) => {
      setStage("recognising");
      try {
        const ai = await recognise({ data: opts });
        setDraft({
          title: ai.title,
          description: ai.description,
          category: (PRODUCT_CATEGORIES as readonly string[]).includes(ai.category)
            ? (ai.category as ProductCategory)
            : "Other",
          tags: ai.tags,
          suggestedPrice: ai.suggestedPrice,
          stock: 1,
          purchasePrice: 0,
          confidence: ai.confidence,
        });
        setStage("result");
      } catch (e) {
        toast.error((e as Error).message || "Could not recognise this product");
        setStage(draft ? "result" : "scanning");
      }
    },
    [recognise, draft],
  );

  const onDetected = useCallback(
    (value: string, fmt?: string, imageDataUrl?: string | null) => {
      setCode(value || null);
      setFormat(fmt ?? null);
      setShot(imageDataUrl ?? null);
      void runRecognition({
        barcode: value || null,
        barcodeFormat: fmt ?? null,
        imageDataUrl: imageDataUrl ?? null,
      });
    },
    [runRecognition],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nothing to list");
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name: draft.title,
          description: draft.description,
          category: draft.category,
          selling_price: draft.suggestedPrice,
          purchase_price: draft.purchasePrice,
          stock_quantity: draft.stock,
          low_stock_threshold: 5,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      toast.success("Product listed");
      qc.invalidateQueries({ queryKey: productsKeys.all });
      navigate({ to: "/products/$productId", params: { productId: p.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <BarcodeScanner
        open={stage === "scanning"}
        onClose={() => navigate({ to: "/dashboard" })}
        onDetected={onDetected}
      />

      <MobileShell>
        <header className="-mx-6 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10 text-primary">
              <ScanLine className="h-4 w-4" />
            </span>
            <h1 className="text-base font-semibold tracking-tight">Scan &amp; list</h1>
          </div>
        </header>

        {stage === "recognising" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
            {shot && (
              <img
                src={shot}
                alt="Scanned product"
                className="h-32 w-32 rounded-3xl object-cover shadow-elevation-2"
              />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Identifying the product…</p>
            <p className="text-xs text-muted-foreground">{code ?? "From photo"}</p>
          </div>
        )}

        {(stage === "result" || stage === "editing") && draft && (
          <div className="mt-5 space-y-5 pb-12">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-2 text-primary">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    Product recognised
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {draft.confidence} match
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                {shot && (
                  <img
                    src={shot}
                    alt={draft.title}
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight">
                    {draft.title}
                  </h2>
                  {draft.suggestedPrice > 0 && (
                    <p className="mt-1 text-sm font-semibold text-primary">
                      ₹{draft.suggestedPrice}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{draft.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {draft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {code && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {format ? `${format.replace(/_/g, " ").toUpperCase()} · ` : ""}
                  {code}
                </p>
              )}
            </div>

            {stage === "result" && draft.confidence !== "high" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = correction.trim();
                  if (!v) return;
                  void runRecognition({
                    barcode: code,
                    barcodeFormat: format,
                    imageDataUrl: shot,
                    name: v,
                  });
                }}
                className="space-y-2 rounded-3xl border border-border bg-card p-4"
              >
                <Label htmlFor="s-fix" className="text-xs">
                  Not the right product? Type its name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="s-fix"
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    placeholder="e.g. Patanjali Dant Kanti 100g"
                    className="h-12 rounded-2xl"
                  />
                  <Button type="submit" className="h-12 rounded-2xl">
                    Retry
                  </Button>
                </div>
              </form>
            )}

            {stage === "editing" && (
              <div className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-elevation-1">
                <div className="space-y-1.5">
                  <Label htmlFor="s-title">Product name</Label>
                  <Input
                    id="s-title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="h-12 rounded-2xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-desc">Description</Label>
                  <Textarea
                    id="s-desc"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-price">Selling price (₹)</Label>
                    <Input
                      id="s-price"
                      type="number"
                      inputMode="decimal"
                      value={draft.suggestedPrice}
                      onChange={(e) =>
                        setDraft({ ...draft, suggestedPrice: Number(e.target.value) || 0 })
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-cost">Purchase price (₹)</Label>
                    <Input
                      id="s-cost"
                      type="number"
                      inputMode="decimal"
                      value={draft.purchasePrice}
                      onChange={(e) =>
                        setDraft({ ...draft, purchasePrice: Number(e.target.value) || 0 })
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-stock">Stock quantity</Label>
                    <Input
                      id="s-stock"
                      type="number"
                      inputMode="numeric"
                      value={draft.stock}
                      onChange={(e) =>
                        setDraft({ ...draft, stock: Number(e.target.value) || 0 })
                      }
                      className="h-12 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-cat">Category</Label>
                    <select
                      id="s-cat"
                      value={draft.category}
                      onChange={(e) =>
                        setDraft({ ...draft, category: e.target.value as ProductCategory })
                      }
                      className="h-12 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                size="lg"
                disabled={save.isPending}
                onClick={() => save.mutate()}
                className="h-14 w-full rounded-2xl text-base font-semibold shadow-elevation-2"
              >
                {save.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    {stage === "editing" ? "List product" : "List this product"}
                  </>
                )}
              </Button>
              {stage === "result" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setStage("editing")}
                  className="h-14 w-full rounded-2xl text-base font-semibold"
                >
                  <Pencil className="mr-2 h-5 w-5" />
                  Edit details &amp; price
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                onClick={() => {
                  setDraft(null);
                  setCode(null);
                  setShot(null);
                  setCorrection("");
                  setStage("scanning");
                }}
                className="h-12 w-full rounded-2xl text-sm font-medium"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Scan another product
              </Button>
            </div>
          </div>
        )}
      </MobileShell>
    </>
  );
}
