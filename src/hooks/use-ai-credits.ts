import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CreditKind = "chats" | "descriptions" | "images";

export interface CreditUsage {
  chats: number;
  descriptions: number;
  images: number;
}

// Credits deducted per action (mock)
export const CREDIT_COST: Record<CreditKind, number> = {
  chats: 2,
  descriptions: 5,
  images: 10,
};

const EMPTY: CreditUsage = { chats: 0, descriptions: 0, images: 0 };
const EVT = "dk_credits_change";

function planQuota(plan: string): number {
  return plan === "business" ? 10000 : plan === "pro" ? 2000 : 100;
}

function storageKey(uid: string | null): string {
  return `dk_ai_usage:${uid ?? "anon"}`;
}

function readUsage(uid: string | null): CreditUsage {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

function writeUsage(uid: string | null, u: CreditUsage) {
  localStorage.setItem(storageKey(uid), JSON.stringify(u));
  window.dispatchEvent(new CustomEvent(EVT));
}

function readPlan(): string {
  return localStorage.getItem("dk_plan") ?? "free";
}

export function useAiCredits() {
  const [uid, setUid] = useState<string | null>(null);
  const [usage, setUsage] = useState<CreditUsage>(EMPTY);
  const [plan, setPlan] = useState<string>(readPlan());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUid(id);
      setUsage(readUsage(id));
    });
    const onChange = () => {
      setPlan(readPlan());
      setUsage(readUsage(uid));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (uid !== null) setUsage(readUsage(uid));
  }, [uid]);

  const quota = planQuota(plan);
  const used =
    usage.chats * CREDIT_COST.chats +
    usage.descriptions * CREDIT_COST.descriptions +
    usage.images * CREDIT_COST.images;
  const remaining = Math.max(0, quota - used);

  const deduct = useCallback(
    (kind: CreditKind, count = 1): boolean => {
      const cost = CREDIT_COST[kind] * count;
      const current = readUsage(uid);
      const currentUsed =
        current.chats * CREDIT_COST.chats +
        current.descriptions * CREDIT_COST.descriptions +
        current.images * CREDIT_COST.images;
      if (currentUsed + cost > planQuota(readPlan())) return false;
      const next: CreditUsage = { ...current, [kind]: current[kind] + count };
      writeUsage(uid, next);
      setUsage(next);
      return true;
    },
    [uid],
  );

  const reset = useCallback(() => {
    writeUsage(uid, { ...EMPTY });
    setUsage({ ...EMPTY });
  }, [uid]);

  return {
    plan,
    quota,
    used,
    remaining,
    usage,
    pct: quota === 0 ? 0 : Math.min(100, Math.round((used / quota) * 100)),
    deduct,
    reset,
    cost: CREDIT_COST,
  };
}
