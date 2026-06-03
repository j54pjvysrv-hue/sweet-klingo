import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import sanaAvatar from "@/assets/sana-avatar.png";

type ChatSearch = { passage?: string; sentence?: string; word?: string };

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => ({
    passage: typeof search.passage === "string" ? search.passage : undefined,
    sentence: typeof search.sentence === "string" ? search.sentence : undefined,
    word: typeof search.word === "string" ? search.word : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chat with Sana — Sweet" },
      { name: "description", content: "Chat with Sana, the AI Korean tutor inside Sweet. Grammar deep dives, roleplay, TOPIK prep, and cultural nuance." },
      { property: "og:title", content: "Chat with Sana — Sweet" },
      { property: "og:description", content: "Your AI Korean tutor, on call." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Explain 은/는 vs 이/가 with simple examples",
  "Quiz me on past tense in polite form",
  "Roleplay: ordering coffee at a Seoul café",
  "Break down: 비가 와서 우산을 가져왔어요",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

function ChatPage() {
  const search = Route.useSearch();
  const [input, setInput] = useState("");
  const [context, setContext] = useState<ChatSearch>(search);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: "sana-default",
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  const contextPreview = useMemo(() => {
    if (context.word) return `Word in focus: ${context.word}`;
    if (context.sentence) return `Sentence in focus: ${context.sentence}`;
    if (context.passage) return `Reading a Sweet passage`;
    return null;
  }, [context]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);
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
    setContext({}); // consume context after first use
    await sendMessage({ text: prefix + t });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 py-4">
        <img src={sanaAvatar} alt="Sana" width={44} height={44} className="h-11 w-11 rounded-full bg-[color:var(--blossom-soft)]/40" />
        <div className="flex-1">
          <div className="font-display text-base font-semibold text-foreground">Sana</div>
          <div className="text-xs text-muted-foreground">AI Korean tutor · powered by Lovable AI</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
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
            <img src={sanaAvatar} alt="" width={96} height={96} className="mx-auto h-24 w-24 rounded-full bg-[color:var(--blossom-soft)]/40" />
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">안녕! I’m Sana.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask me anything about Korean — grammar, nuance, K-drama lines, TOPIK prep.
            </p>
            <div className="mt-6 grid gap-2 text-left">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((m: UIMessage) => (
            <Bubble key={m.id} message={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Dots /> Sana is thinking…
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Sana hit a snag: {error.message}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="sticky bottom-0 border-t border-border/60 bg-background/85 py-3 backdrop-blur"
      >
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-petal focus-within:border-primary">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={contextPreview ? "Ask Sana about this…" : "Ask Sana in English or Korean…"}
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
        <p className="mt-2 px-2 text-[11px] text-muted-foreground">
          Sana can be wrong. For exams, double-check key grammar.
        </p>
      </form>
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
      <img src={sanaAvatar} alt="" width={32} height={32} className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[color:var(--blossom-soft)]/40" />
      <div className="max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{text}</div>
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
