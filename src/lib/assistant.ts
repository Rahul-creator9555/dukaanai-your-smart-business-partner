import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ChatThread = Tables<"chat_threads">;
export type ChatMessage = Tables<"chat_messages">;
export type ChatRole = "user" | "assistant" | "system";

export const assistantKeys = {
  all: ["assistant"] as const,
  threads: () => [...assistantKeys.all, "threads"] as const,
  messages: (threadId: string) => [...assistantKeys.all, "messages", threadId] as const,
};

export const STARTER_PROMPTS: { label: string; prompt: string; emoji: string }[] = [
  {
    emoji: "📈",
    label: "What products are trending?",
    prompt: "What products are trending in my category right now?",
  },
  {
    emoji: "📦",
    label: "What should I stock?",
    prompt: "Based on my shop, what should I stock next month?",
  },
  {
    emoji: "✍️",
    label: "Generate a product description",
    prompt: "Write a compelling product description for a premium moisturising face cream.",
  },
  {
    emoji: "📊",
    label: "Explain inventory reports",
    prompt: "Explain the key metrics I should track in my inventory report.",
  },
];

export async function listThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchThread(id: string): Promise<ChatThread | null> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createThread(title = "New chat"): Promise<ChatThread> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: user.id, title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameThread(id: string, title: string) {
  const { error } = await supabase.from("chat_threads").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("chat_threads").delete().eq("id", id);
  if (error) throw error;
}

export async function insertMessage(
  threadId: string,
  role: ChatRole,
  content: string,
): Promise<ChatMessage> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ thread_id: threadId, user_id: user.id, role, content })
    .select()
    .single();
  if (error) throw error;
  // Touch thread updated_at so it moves to top of the list
  await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  return data;
}

export function suggestTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) return trimmed;
  return trimmed.slice(0, 45).trimEnd() + "…";
}

/**
 * Placeholder assistant responder. Deterministic canned answers based on
 * intent keywords. Swap this out for a real model call by replacing this
 * function's implementation.
 */
export async function generatePlaceholderReply(prompt: string): Promise<string> {
  // simulate think time
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
  const q = prompt.toLowerCase();

  if (/(trend|hot|popular|selling)/.test(q)) {
    return [
      "Here are a few categories showing strong momentum this week:",
      "",
      "1. **Cosmetics** — Vitamin C serums and lip tints are up ~18% week over week.",
      "2. **Grocery** — Cold-pressed oils and millet-based snacks are steadily climbing.",
      "3. **Electronics** — Compact power banks (10,000mAh+) are trending with students.",
      "",
      "Want me to open the Trends module filtered to your shop's category?",
    ].join("\n");
  }

  if (/(stock|restock|reorder|inventory alert)/.test(q)) {
    return [
      "Based on typical seasonal patterns, consider stocking:",
      "",
      "- **Fast movers** you're low on (check the Inventory → Low Stock tab).",
      "- **Weekend essentials** — Fridays usually see a 22% lift in impulse buys.",
      "- **Trending SKUs** from the Trends screen — start with 5–10 units to test demand.",
      "",
      "Rule of thumb: reorder when stock ≤ 1.5× your weekly sales.",
    ].join("\n");
  }

  if (/(descri|copy|listing|write.*product|marketing)/.test(q)) {
    return [
      "Here's a draft you can tweak:",
      "",
      "> **Radiance Renewal Cream** — A lightweight daily moisturiser infused with hyaluronic acid and vitamin E. Deeply hydrates without a greasy finish and helps restore a natural, healthy glow.",
      "",
      "**Key selling points**",
      "- 24-hour hydration",
      "- Suitable for all skin types",
      "- Dermatologically tested",
      "",
      "Tell me the product name and I'll tailor it.",
    ].join("\n");
  }

  if (/(report|metric|kpi|analytic|explain)/.test(q)) {
    return [
      "The most useful inventory metrics to watch:",
      "",
      "- **Stock value** — total money tied up in unsold inventory.",
      "- **Sell-through rate** — units sold ÷ units received. Aim for 70%+ within 30 days.",
      "- **Days of supply** — how long current stock will last at recent sales pace.",
      "- **Dead stock** — SKUs with zero movement for 60+ days. Consider discounting.",
      "",
      "Would you like me to walk through any one of these?",
    ].join("\n");
  }

  return [
    "I'm your AI shop assistant. I can help you with:",
    "",
    "- Discovering **trending products** for your category",
    "- Deciding **what to stock** and when to reorder",
    "- Writing **product descriptions** and listing copy",
    "- Explaining **inventory reports** and metrics",
    "",
    "Try one of the suggestions below, or ask me anything about your shop.",
  ].join("\n");
}
