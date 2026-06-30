import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  PRODUCT_CATEGORIES,
  productsKeys,
  uploadProductImage,
  type ProductCategory,
} from "@/lib/products";
import {
  generateProductDetails,
  type AIGeneratedProduct,
} from "@/lib/ai-product";

export const Route = createFileRoute("/_authenticated/products/generate")({
  head: () => ({ meta: [{ title: "AI Product Generator — DukaanAI" }] }),
  component: GeneratePage,
});

function GeneratePage() {
  const navigate = useNavigate();
  return (
    <MobileShell>
      <div className="flex min-h-full flex-col">
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
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-base font-semibold tracking-tight">AI Product Generator</h1>
          </div>
        </header>
        <Generator />
      </div>
    </MobileShell>
  );
}

type Stage = "input" | "loading" | "review";

function Generator() {
  const [stage, setStage] = useState<Stage>("input");
  const [hint, setHint] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<AIGeneratedProduct | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const generate = useMutation({
    mutationFn: () => generateProductDetails({ name: hint, image: file }),
    onMutate: () => setStage("loading"),
    onSuccess: (data) => {
      setDraft(data);
      setStage("review");
    },
    onError: (e) => {
      toast.error((e as Error).message || "Generation failed");
      setStage("input");
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Nothing to save");
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) throw new Error("Not signed in");

      let imagePath: string | null = null;
      if (file) imagePath = await uploadProductImage(user.id, file);

      const { data, error } = await supabase
        .from("products")
        .insert({
          user_id: user.id,
          name: draft.title,
          description: draft.description,
          category: draft.category,
          selling_price: draft.suggestedPrice,
          purchase_price: 0,
          stock_quantity: 0,
          low_stock_threshold: 5,
          image_url: imagePath,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      toast.success("Product added");
      qc.invalidateQueries({ queryKey: productsKeys.all });
      navigate({ to: "/products/$productId", params: { productId: p.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(f);
  };

  if (stage === "loading") return <LoadingState hasImage={!!file} />;

  if (stage === "review" && draft) {
    return (
      <ReviewState
        draft={draft}
        setDraft={setDraft}
        previewUrl={previewUrl}
        onRegenerate={() => generate.mutate()}
        onBack={() => setStage("input")}
        onSave={() => save.mutate()}
        saving={save.isPending}
      />
    );
  }

  const canGenerate = hint.trim().length > 0 || !!file;

  return (
    <div className="mt-6 space-y-6 pb-10">
      <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">AI assist</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">
          Create a listing in seconds
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a product photo or type a name. AI will draft the title,
          description, category, tags, and a suggested price.
        </p>
      </div>

      <section className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Product image</Label>
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary">
            <img src={previewUrl} alt="" className="h-56 w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur hover:bg-background"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Tap to upload a photo</span>
            <span className="text-xs">PNG or JPG, up to 5MB</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickImage}
        />
      </section>

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <section className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Product name</Label>
        <Input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. Paracetamol 500mg, Cotton T-Shirt"
          className="h-12 rounded-2xl"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          A short hint is enough — AI will fill in the rest.
        </p>
      </section>

      <Button
        type="button"
        onClick={() => generate.mutate()}
        disabled={!canGenerate}
        className="h-12 w-full rounded-2xl text-base font-semibold"
      >
        <Wand2 className="h-4 w-4" />
        Generate with AI
      </Button>
    </div>
  );
}

function LoadingState({ hasImage }: { hasImage: boolean }) {
  const steps = [
    hasImage ? "Analyzing image" : "Understanding product",
    "Drafting title & description",
    "Suggesting category & price",
  ];
  return (
    <div className="mt-10 flex flex-col items-center gap-6 pb-10 text-center">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-primary/10" />
        <span className="relative grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </span>
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Generating your product</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hang tight — this only takes a moment.
        </p>
      </div>
      <ul className="w-full max-w-xs space-y-2">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
            style={{ animation: `fade-in 0.4s ease-out ${i * 0.25}s both` }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-foreground">{s}…</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewState({
  draft,
  setDraft,
  previewUrl,
  onRegenerate,
  onBack,
  onSave,
  saving,
}: {
  draft: AIGeneratedProduct;
  setDraft: (d: AIGeneratedProduct) => void;
  previewUrl: string | null;
  onRegenerate: () => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [tagInput, setTagInput] = useState("");
  const update = <K extends keyof AIGeneratedProduct>(k: K, v: AIGeneratedProduct[K]) =>
    setDraft({ ...draft, [k]: v });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (draft.tags.includes(t)) {
      setTagInput("");
      return;
    }
    update("tags", [...draft.tags, t].slice(0, 8));
    setTagInput("");
  };

  return (
    <div className="mt-5 space-y-6 pb-28">
      <div className="flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            AI draft — edit anything
          </span>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Regenerate
        </button>
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
          <img src={previewUrl} alt="" className="h-48 w-full object-cover" />
        </div>
      )}

      <section className="space-y-3">
        <FieldLabel>Title</FieldLabel>
        <Input
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          className="h-11 rounded-xl"
          maxLength={120}
        />

        <FieldLabel>Description</FieldLabel>
        <Textarea
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="rounded-xl"
          maxLength={2000}
        />

        <FieldLabel>Category</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map((c) => {
            const active = draft.category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => update("category", c as ProductCategory)}
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

        <FieldLabel>Suggested price (₹)</FieldLabel>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="1"
          value={draft.suggestedPrice}
          onChange={(e) => update("suggestedPrice", Number(e.target.value || 0))}
          className="h-11 rounded-xl"
        />

        <FieldLabel>Tags</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => update("tags", draft.tags.filter((x) => x !== t))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag"
            className="h-10 rounded-xl"
            maxLength={24}
          />
          <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">
            Add
          </Button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 backdrop-blur sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-b-3xl">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 flex-1 rounded-2xl"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || !draft.title.trim()}
            className="h-12 flex-[1.6] rounded-2xl text-base font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save product"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-medium text-muted-foreground">{children}</Label>;
}
