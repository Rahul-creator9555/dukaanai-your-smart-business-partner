import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquarePlus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import {
  STARTER_PROMPTS,
  assistantKeys,
  createThread,
  deleteThread,
  insertMessage,
  listThreads,
  suggestTitle,
} from "@/lib/assistant";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — DukaanAI" }] }),
  component: AssistantHubPage,
});

function AssistantHubPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();

  const { data: threads, isLoading } = useQuery({
    queryKey: assistantKeys.threads(),
    queryFn: listThreads,
  });

  const newChat = useMutation({
    mutationFn: async (starter?: string) => {
      const title = starter ? suggestTitle(starter) : "New chat";
      const thread = await createThread(title);
      if (starter) {
        await insertMessage(thread.id, "user", starter);
      }
      return { thread, starter };
    },
    onSuccess: ({ thread, starter }) => {
      qc.invalidateQueries({ queryKey: assistantKeys.threads() });
      navigate({
        to: "/assistant/$threadId",
        params: { threadId: thread.id },
        search: starter ? { auto: "1" } : {},
      });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteThread(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.threads() }),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <MobileShell>
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              AI Assistant
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Ask anything</h1>
          <p className="text-xs text-muted-foreground">
            Get help running your shop — trends, stock, listings, and reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => newChat.mutate(undefined)}
          disabled={newChat.isPending}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elevation-1 transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </header>

      {/* Starters */}
      <section className="mt-5">
        <p className="text-xs font-medium text-muted-foreground">Try asking</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {STARTER_PROMPTS.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={newChat.isPending}
              onClick={() => newChat.mutate(s.prompt)}
              className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevation-2 disabled:opacity-60"
            >
              <span className="text-lg" aria-hidden>
                {s.emoji}
              </span>
              <span className="text-xs font-semibold leading-snug text-foreground">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent conversations */}
      <section className="mt-6 flex-1 pb-24">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Recent chats</p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (threads?.length ?? 0) === 0 ? (
          <button
            type="button"
            onClick={() => newChat.mutate(undefined)}
            disabled={newChat.isPending}
            className="flex w-full flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center transition-colors hover:bg-secondary/50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquarePlus className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold">Start your first chat</h3>
            <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
              Ask about trending SKUs, restock timing, or generate a listing.
            </p>
          </button>
        ) : (
          <ul className="space-y-2">
            {threads!.map((t) => (
              <li key={t.id}>
                <div className="group flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2">
                  <Link
                    to="/assistant/$threadId"
                    params={{ threadId: t.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove.mutate(t.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav />
    </MobileShell>
  );
}
