import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Send, Sparkles, Trash2, X, Menu } from "lucide-react";
import soyeonAvatar from "@/assets/soyeon-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/markdown";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type ChatSearch = { passage?: string; sentence?: string; word?: string };

export const Route = createFileRoute("/chat/$threadId")({
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    passage: typeof s.passage === "string" ? s.passage : undefined,
    sentence: typeof s.sentence === "string" ? s.sentence : undefined,
    word: typeof s.word === "string" ? s.word : undefined,
  }),
  head: () => ({ meta: [{ title: "Soyeon — Sweet" }] }),
  component: ThreadPage,
});

const SUGGESTIONS = [
  "Explain 은/는 vs 이/가 with simple examples",
  "Quiz me on past tense in polite form",
  "Roleplay: ordering coffee at a Seoul café",
  "Break down: 비가 와서 우산을 가져왔어요",
];

type Thread = { id: string; title: string; updated_at: string };

function ThreadPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [input, setInput] = useState("");
  const [context, setContext] = useState<ChatSearch>(search);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [hydrated, setHydrated] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setContext(search); }, [search]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  // Thread list
  useEffect(() => {
    supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setThreads(data ?? []));
  }, [threadId]);

  // Persisted messages
  useEffect(() => {
    setInitial(null);
    setHydrated(null);
    supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", threadId)
      .order("created_at")
      .then(({ data }) => {
        const msgs: UIMessage[] = (data ?? []).map((r) => ({
          id: r.id,
          role: r.role as UIMessage["role"],
          parts: (r.parts ?? []) as UIMessage["parts"],
        }));
        setInitial(msgs);
      });
  }, [threadId]);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: { threadId },
    });
  }, [token, threadId]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: threadId,
    transport,
  });

  // Hydrate once per thread to avoid clobbering live messages
  useEffect(() => {
    if (initial && hydrated !== threadId) {
      setMessages(initial);
      setHydrated(threadId);
    }
  }, [initial, hydrated, threadId, setMessages]);

  const busy = status === "submitted" || status === "streaming";

  const contextPreview = useMemo(() => {
    if (context.word) return `Word in focus: ${context.word}`;
    if (context.sentence) return `Sentence in focus: ${context.sentence}`;
    if (context.passage) return `Reading a Sweet passage`;
    return null;
  }, [context]);

  useEffect(() => { inputRef.current?.focus(); }, [threadId]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    let prefix = "";
    if (context.word) prefix = `(About the Korean word **${context.word}** from a Sweet passage) `;
    else if (context.sentence) prefix = `(About this Korean sentence — **${context.sentence}** — from a Sweet passage) `;
    setInput("");
    setContext({});
    await sendMessage({ text: prefix + t });
  }

  async function newThread() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      toast.error("Please sign in to start a conversation.");
      navigate({ to: "/auth" });
      return;
    }
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: userRes.user.id, title: "New conversation" })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    setMobileOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  }

  async function deleteThread(id: string) {
    await supabase.from("chat_messages").delete().eq("thread_id", id);
    await supabase.from("chat_threads").delete().eq("id", id);
    if (id === threadId) navigate({ to: "/chat" });
    else setThreads((t) => t.filter((x) => x.id !== id));
  }

  const ThreadList = (
    <div className="flex h-full flex-col gap-2 p-3">
      <button
        onClick={newThread}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-blossom px-4 py-2 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02]"
      >
        <Plus className="h-4 w-4" /> New chat
      </button>
      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {threads.map((t) => (
          <div key={t.id} className={"group flex items-center gap-1 rounded-lg pr-1 " + (t.id === threadId ? "bg-secondary" : "hover:bg-secondary/60")}>
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              onClick={() => setMobileOpen(false)}
              className="flex-1 truncate px-2.5 py-2 text-sm text-foreground"
            >
              {t.title || "Conversation"}
            </Link>
            <button onClick={() => deleteThread(t.id)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {threads.length === 0 && <p className="px-2 text-xs text-muted-foreground">No conversations yet.</p>}
      </div>
    </div>
  );

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 gap-4 px-3 py-3 md:grid-cols-[260px_1fr] md:px-5">
      {/* Desktop sidebar */}
      <aside className="hidden flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex">
        {ThreadList}
      </aside>

      {/* Conversation */}
      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/60 pb-4">
          {/* Mobile sidebar trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button aria-label="Conversations" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card md:hidden">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle>Soyeon threads</SheetTitle>
              </SheetHeader>
              {ThreadList}
            </SheetContent>
          </Sheet>

          <img src={soyeonAvatar} alt="Soyeon" width={44} height={44} className="h-11 w-11 rounded-full bg-[color:var(--blossom-soft)]/40" />
          <div className="flex-1">
            <div className="font-display text-base font-semibold text-foreground">Soyeon</div>
            <div className="text-xs text-muted-foreground">AI Korean tutor · threaded · saved</div>
          </div>
          <button onClick={newThread} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary md:hidden">
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          <span className="hidden items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary md:inline-flex">
            <Sparkles className="h-3 w-3" /> Live
          </span>
        </div>

        {contextPreview && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-primary/40 bg-[color:var(--blossom-soft)]/30 px-4 py-2 text-sm text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 font-korean">{contextPreview}</span>
            <button onClick={() => setContext({})} className="grid h-6 w-6 place-items-center rounded-full hover:bg-card">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md text-center">
              <img src={soyeonAvatar} alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-full bg-[color:var(--blossom-soft)]/40" />
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">안녕! I'm Soyeon.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ask me anything about Korean — your messages save automatically.</p>
              <div className="mt-6 grid gap-2 text-left">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((m: UIMessage) => <Bubble key={m.id} message={m} />)}
            {busy && (
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Dots /> Soyeon is thinking…
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Soyeon hit a snag: {error.message}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="sticky bottom-0 border-t border-border/60 bg-background/85 py-3 backdrop-blur"
        >
          <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-petal focus-within:border-primary">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
              }}
              placeholder={contextPreview ? "Ask Soyeon about this…" : "Ask Soyeon in English or Korean…"}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-blossom text-primary-foreground shadow-petal transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 px-2 text-[11px] text-muted-foreground">Soyeon can be wrong. For exams, double-check key grammar.</p>
        </form>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  if (!text) return null;
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-petal">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <img src={soyeonAvatar} alt="" width={32} height={32} className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[color:var(--blossom-soft)]/40" />
      <div className="max-w-[85%]">
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
    </span>
  );
}
