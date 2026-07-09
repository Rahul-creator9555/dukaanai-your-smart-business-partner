import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import {
  searchReferenceCatalog,
  type ReferenceProduct,
} from "@/lib/reference-catalog";
import { generateProductDetails } from "@/lib/ai-product";
import { listProductOnShopify } from "@/lib/shopify-list.functions";
import { formatCurrency } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/list-product")({
  head: () => ({
    meta: [{ title: "List a product — DukaanAI" }],
  }),
  component: ListProductPage,
});

type Mode = "search" | "confirm-exact" | "capture" | "confirm-ai" | "done";

function ListProductPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ReferenceProduct | null>(null);
  const [aiDraft, setAiDraft] = useState<null | {
    title: string;
    description: string;
    tags: string[];
    category: string;
    price: number;
    imageDataUrl: string | null;
  }>(null);
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [result, setResult] = useState<null | {
    handle: string;
    title: string;
    adminUrl: string;
  }>(null);

  const results = useMemo(() => searchReferenceCatalog(query), [query]);
  const listFn = useServerFn(listProductOnShopify);

  const submit = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const shopAddress = address.trim();
      if (!shopAddress) throw new Error("Please add your shop address");

      if (picked) {
        return listFn({
          data: {
            title: picked.title,
            description: picked.description,
            price: Number(price || picked.suggestedPrice),
            currency: picked.currency,
            imageUrl: picked.imageUrl,
            tags: picked.tags,
            category: picked.category,
            vendor: picked.brand,
            sku: picked.barcode ?? "",
            stock: Math.max(0, Number(stock || 1)),
            address: shopAddress,
          },
        });
      }

      if (!aiDraft) throw new Error("Missing product details");
      return listFn({
        data: {
          title: aiDraft.title,
          description: aiDraft.description,
          price: Number(price || aiDraft.price),
          currency: "INR",
          // Data URLs can't be sent to Shopify — server will skip image if null.
          // Retailer can upload a hosted image later from Shopify admin.
          imageUrl: null,
          tags: aiDraft.tags,
          category: aiDraft.category,
          vendor: userRes.user?.user_metadata?.shop_name ?? "",
          sku: "",
          stock: Math.max(0, Number(stock || 1)),
          address: shopAddress,
        },
      });
    },
    onSuccess: (r) => {
      setResult(r);
      setMode("done");
      toast.success("Listed on Shopify");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <MobileShell>
      <header className="-mx-6 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => (mode === "search" ? navigate({ to: "/dashboard" }) : reset())}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">
            List a product
          </h1>
          <p className="truncate text-[11px] text-muted-foreground">
            Publish directly to your Shopify store
          </p>
        </div>
      </header>

      <div className="flex-1">
        {mode === "search" && (
          <SearchView
            query={query}
            setQuery={setQuery}
            results={results}
            onPick={(p) => {
              setPicked(p);
              setPrice(String(p.suggestedPrice));
              setMode("confirm-exact");
            }}
            onCapture={() => setMode("capture")}
          />
        )}

        {mode === "confirm-exact" && picked && (
          <ConfirmView
            title={picked.title}
            image={picked.imageUrl}
            description={picked.description}
            tags={picked.tags}
            category={picked.category}
            brand={picked.brand}
            price={price}
            setPrice={setPrice}
            stock={stock}
            setStock={setStock}
            address={address}
            setAddress={setAddress}
            onSubmit={() => submit.mutate()}
            submitting={submit.isPending}
            currency={picked.currency}
            source="catalog"
          />
        )}

        {mode === "capture" && (
          <CaptureView
            onGenerated={(draft) => {
              setAiDraft(draft);
              setPrice(String(draft.price));
              setMode("confirm-ai");
            }}
          />
        )}

        {mode === "confirm-ai" && aiDraft && (
          <ConfirmView
            title={aiDraft.title}
            image={aiDraft.imageDataUrl}
            description={aiDraft.description}
            tags={aiDraft.tags}
            category={aiDraft.category}
            brand=""
            price={price}
            setPrice={setPrice}
            stock={stock}
            setStock={setStock}
            address={address}
            setAddress={setAddress}
            onSubmit={() => submit.mutate()}
            submitting={submit.isPending}
            currency="INR"
            source="ai"
          />
        )}

        {mode === "done" && result && (
          <DoneView
            title={result.title}
            adminUrl={result.adminUrl}
            onAnother={reset}
          />
        )}
      </div>

      <BottomNav />
    </MobileShell>
  );

  function reset() {
    setMode("search");
    setPicked(null);
    setAiDraft(null);
    setPrice("");
    setStock("1");
    setResult(null);
  }
}

function SearchView({
  query,
  setQuery,
  results,
  onPick,
  onCapture,
}: {
  query: string;
  setQuery: (v: string) => void;
  results: ReferenceProduct[];
  onPick: (p: ReferenceProduct) => void;
  onCapture: () => void;
}) {
  return (
    <section className="mt-5 space-y-4">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products (e.g. Maggi, Dove, Amul)"
          className="h-12 rounded-2xl pl-9"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      {query && results.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            Tap the product you sell — we'll copy its image, description and tags.
          </p>
          <ul className="space-y-2">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/60 hover:bg-secondary/60"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.brand} • {p.category}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-primary">
                      {formatCurrency(p.suggestedPrice)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {query && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center">
          <p className="text-sm font-medium">No match in the catalog</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Snap a photo — AI will write the description and tags for you.
          </p>
          <Button onClick={onCapture} className="mt-4 h-11 rounded-2xl">
            <Camera className="mr-1 h-4 w-4" />
            Click a photo
          </Button>
        </div>
      )}

      {!query && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onCapture}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-primary-container/40 p-4 text-left transition hover:bg-primary-container/60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Camera className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                New product? Snap a photo
              </span>
              <span className="block text-[11px] text-muted-foreground">
                AI writes the title, description and tags
              </span>
            </span>
          </button>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4 text-primary" />
              How it works
            </div>
            <ol className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
              <li>1. Search the product you sell in your shop.</li>
              <li>
                2. If it's in the catalog, tap <b>I have this exact product</b>.
              </li>
              <li>
                3. If not, click a photo — AI fills in the details.
              </li>
              <li>4. Confirm price + address → we list it on Shopify.</li>
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function CaptureView({
  onGenerated,
}: {
  onGenerated: (d: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    price: number;
    imageDataUrl: string | null;
  }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    if (!file && !name.trim()) {
      toast.error("Add a photo or a product name");
      return;
    }
    setBusy(true);
    try {
      const ai = await generateProductDetails({ name, image: file });
      onGenerated({
        title: ai.title,
        description: ai.description,
        tags: ai.tags,
        category: ai.category,
        price: ai.suggestedPrice,
        imageDataUrl: preview,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5 space-y-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="grid aspect-square w-full place-items-center rounded-3xl border-2 border-dashed border-border bg-secondary/40 text-center transition hover:bg-secondary"
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="h-full w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="text-muted-foreground">
            <Camera className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm font-medium">Tap to click a photo</p>
            <p className="text-[11px]">or choose from gallery</p>
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPick}
      />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Product name (optional hint)
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Handmade jute bag"
          className="h-11 rounded-xl"
        />
      </div>

      <Button
        onClick={generate}
        disabled={busy}
        className="h-12 w-full rounded-2xl text-base font-semibold"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Generate with AI
          </>
        )}
      </Button>
    </section>
  );
}

function ConfirmView(props: {
  title: string;
  image: string | null;
  description: string;
  tags: string[];
  category: string;
  brand: string;
  price: string;
  setPrice: (v: string) => void;
  stock: string;
  setStock: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  currency: string;
  source: "catalog" | "ai";
}) {
  return (
    <section className="mt-5 space-y-4 pb-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {props.image ? (
          <img
            src={props.image}
            alt=""
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="grid h-32 w-full place-items-center bg-secondary text-muted-foreground">
            <Camera className="h-6 w-6" />
          </div>
        )}
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] font-medium"
            >
              {props.source === "catalog" ? "From catalog" : "AI-generated"}
            </Badge>
            {props.category && (
              <Badge variant="outline" className="rounded-full text-[10px]">
                {props.category}
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold leading-tight">{props.title}</p>
          {props.brand && (
            <p className="text-[11px] text-muted-foreground">{props.brand}</p>
          )}
          <p className="text-xs text-muted-foreground">{props.description}</p>
          {props.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {props.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Your price ({props.currency})
          </Label>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            value={props.price}
            onChange={(e) => props.setPrice(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Stock</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={props.stock}
            onChange={(e) => props.setStock(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Shop address (shown on the listing)
        </Label>
        <Textarea
          value={props.address}
          onChange={(e) => props.setAddress(e.target.value)}
          rows={2}
          placeholder="Shop name, street, city, PIN"
          className="rounded-xl"
        />
      </div>

      <Button
        onClick={props.onSubmit}
        disabled={props.submitting}
        className="h-12 w-full rounded-2xl text-base font-semibold"
      >
        {props.submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Listing on Shopify…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> I have this — list it on
            Shopify
          </>
        )}
      </Button>
    </section>
  );
}

function DoneView({
  title,
  adminUrl,
  onAnother,
}: {
  title: string;
  adminUrl: string;
  onAnother: () => void;
}) {
  return (
    <section className="mt-8">
      <EmptyState
        icon={CheckCircle2}
        title="Listed on Shopify"
        description={`"${title}" is now live in your Shopify catalogue.`}
      />
      <div className="mt-4 flex flex-col gap-2">
        <a
          href={adminUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" /> Open in Shopify admin
        </a>
        <Button onClick={onAnother} className="h-11 rounded-2xl">
          List another product
        </Button>
        <Link
          to="/dashboard"
          className="text-center text-xs text-muted-foreground hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
