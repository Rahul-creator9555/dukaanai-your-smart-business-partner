import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUp,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { z } from "zod";
import { MobileShell } from "@/components/MobileShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiCredits } from "@/hooks/use-ai-credits";
import { useT } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STARTER_PROMPTS,
  assistantKeys,
  deleteThread,
  fetchThread,
  generatePlaceholderReply,
  insertMessage,
  listMessages,
  renameThread,
  suggestTitle,
  type ChatMessage,
} from "@/lib/assistant";

const searchSchema = z.object({
  auto: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  head: () => ({ meta: [{ title: "Chat — DukaanAI" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { auto } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoRepliedRef = useRef(false);

  const { data: thread } = useQuery({
    queryKey: ["assistant", "thread", threadId],
    queryFn: () => fetchThread(threadId),
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: assistantKeys.messages(threadId),
    queryFn: () => listMessages(threadId),
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMsg = await insertMessage(threadId, "user", trimmed);
      qc.setQueryData<ChatMessage[]>(assistantKeys.messages(threadId), (prev) =>
        prev ? [...prev, userMsg] : [userMsg],
      );
      // If this is the first user message, use it as the thread title
      const existing = qc.getQueryData<ChatMessage[]>(assistantKeys.messages(threadId)) ?? [];
      const userCount = existing.filter((m) => m.role === "user").length;
      if (userCount <= 1 && thread && thread.title === "New chat") {
        await renameThread(threadId, suggestTitle(trimmed));
        qc.invalidateQueries({ queryKey: assistantKeys.threads() });
        qc.invalidateQueries({ queryKey: ["assistant", "thread", threadId] });
      }

      setThinking(true);
      try {
        const reply = await generatePlaceholderReply(trimmed);
        const assistantMsg = await insertMessage(threadId, "assistant", reply);
        qc.setQueryData<ChatMessage[]>(assistantKeys.messages(threadId), (prev) =>
          prev ? [...prev, assistantMsg] : [assistantMsg],
        );
      } finally {
        setThinking(false);
      }
    },
    onError: (e) => {
      setThinking(false);
      toast.error((e as Error).message);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteThread(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.threads() });
      navigate({ to: "/assistant" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Auto-reply once when arriving from a starter prompt (user message already saved)
  useEffect(() => {
    if (auto !== "1" || autoRepliedRef.current) return;
    if (!messages) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    autoRepliedRef.current = true;
    (async () => {
      setThinking(true);
      try {
        const reply = await generatePlaceholderReply(last.content);
        const assistantMsg = await insertMessage(threadId, "assistant", reply);
        qc.setQueryData<ChatMessage[]>(assistantKeys.messages(threadId), (prev) =>
          prev ? [...prev, assistantMsg] : [assistantMsg],
        );
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setThinking(false);
        // strip the ?auto=1 flag so a refresh doesn't re-fire
        navigate({
          to: "/assistant/$threadId",
          params: { threadId },
          search: {},
          replace: true,
        });
      }
    })();
  }, [auto, messages, threadId, qc, navigate]);

  // Auto-scroll
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // Focus input on mount and after sends
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);
  useEffect(() => {
    if (!send.isPending && !thinking) inputRef.current?.focus();
  }, [send.isPending, thinking]);

  const showStarters = useMemo(
    () => !isLoading && (messages?.length ?? 0) === 0 && !thinking,
    [isLoading, messages, thinking],
  );

  const submit = () => {
    if (!input.trim() || send.isPending || thinking) return;
    const text = input;
    setInput("");
    send.mutate(text);
  };

  return (
    <MobileShell>
      <div className="flex min-h-full flex-col">
        {/* Header */}
        <header className="-mx-6 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() =>
              router.history.canGoBack()
                ? router.history.back()
                : navigate({ to: "/assistant" })
            }
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{thread?.title ?? "Chat"}</p>
              <p className="text-[10px] text-muted-foreground">DukaanAI Assistant</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-secondary"
                aria-label="More"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate({ to: "/assistant" })}
                className="gap-2"
              >
                <MessageSquarePlus className="h-4 w-4" />
                All chats
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => remove.mutate()}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Transcript */}
        <div
          ref={scrollRef}
          className="-mx-6 flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-3/4 rounded-2xl" />
              <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            </div>
          ) : showStarters ? (
            <EmptyThread onPick={(p) => send.mutate(p)} />
          ) : (
            <ul className="space-y-4">
              {messages!.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {thinking && <TypingIndicator />}
            </ul>
          )}
        </div>

        {/* Composer */}
        <div className="-mx-6 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 shadow-elevation-1 focus-within:border-primary/60"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Ask about products, stock, trends…"
              className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={send.isPending || thinking}
            />
            <button
              type="submit"
              disabled={!input.trim() || send.isPending || thinking}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:scale-105 disabled:bg-secondary disabled:text-muted-foreground disabled:hover:scale-100"
            >
              {send.isPending || thinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
              )}
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            AI responses are illustrative — verify important decisions.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <li className="flex justify-end">
        <div className="flex max-w-[85%] items-end gap-2">
          <div className="rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-elevation-1">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </span>
        </div>
      </li>
    );
  }
  return (
    <li className="flex justify-start">
      <div className="flex max-w-[92%] gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="prose prose-sm max-w-none rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm text-foreground shadow-elevation-1 prose-p:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-blockquote:my-2 prose-blockquote:border-l-primary prose-strong:text-foreground prose-code:text-foreground dark:prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </li>
  );
}

function TypingIndicator() {
  return (
    <li className="flex justify-start">
      <div className="flex gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-elevation-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </div>
      </div>
    </li>
  );
}

function EmptyThread({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-tight">How can I help?</h2>
      <p className="mt-1 max-w-[18rem] text-xs text-muted-foreground">
        Pick a suggestion or type your own question below.
      </p>
      <div className="mt-5 grid w-full grid-cols-1 gap-2">
        {STARTER_PROMPTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevation-2"
          >
            <span className="text-base" aria-hidden>
              {s.emoji}
            </span>
            <span className="text-xs font-semibold text-foreground">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
