import { useState, useRef, useEffect } from "react";
import { Send, Zap, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import electricAgents from "@/assets/electric-agents.jpg";

type Message = { role: "user" | "assistant"; content: string };

// ── n8n AI agent connection ──────────────────────────────────────────────────
// The chat POSTs each customer message to your n8n Chat Trigger / AI Agent
// webhook and renders the reply. Set the Production webhook URL in .env.local:
//   VITE_N8N_WEBHOOK_URL="https://<your-n8n-host>/webhook/<id>/chat"
// Without it, the section runs in a friendly demo mode.
const N8N_WEBHOOK_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL;

// One stable session id per browser tab so the agent can keep conversation memory.
const sessionId =
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// n8n flows vary in how they shape the reply — pull the text from whichever
// key comes back. Also unwraps the common `[{ ... }]` single-item array form.
const extractReply = (data: unknown): string => {
  const pick = (obj: Record<string, unknown>): string | undefined => {
    for (const key of ["output", "text", "reply", "message", "answer", "response"]) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    return undefined;
  };
  if (typeof data === "string") return data;
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return pick(first as Record<string, unknown>) ?? "";
  }
  if (data && typeof data === "object") return pick(data as Record<string, unknown>) ?? "";
  return "";
};

const GREETING =
  "Hi! 👋 I'm EVA, the Electrifying the US assistant. Ask me anything about EV charging, batteries, home setup, costs, or incentives — or tap a question below to get started.";

// Clickable starter questions — drawn from the EVNoire EV Charging 101 knowledge base.
const SUGGESTED_QUESTIONS = [
  "What's the difference between a hybrid and a fully electric vehicle?",
  "How long do EV batteries last?",
  "Can I charge an EV at home — and what do I need?",
  "How much does it cost to charge an EV at home?",
  "Where can I find public charging stations?",
  "How much does public charging cost?",
  "I live in an apartment — can I still charge?",
  "Which charging connector does my EV use (NACS vs CCS)?",
  "Will charging an EV raise my electric bill?",
  "What incentives are available for home charging?",
];

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target={href?.startsWith("/") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="underline font-medium text-[hsl(var(--term-link))]"
    >
      {children}
    </a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-[hsl(var(--term-cyan))]">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
};

const AgentChatSection = () => {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the conversation pinned to the newest message without moving the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      if (!N8N_WEBHOOK_URL) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm running in **demo mode** right now — the AI agent isn't connected yet. Once the team sets the n8n webhook, I'll answer your questions live. In the meantime, explore the site or reach us at **info@electrifyingtheus.com**.",
          },
        ]);
        setLoading(false);
        return;
      }

      const resp = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId,
          chatInput: text,
          message: text,
        }),
      });

      if (!resp.ok) throw new Error(`Webhook responded ${resp.status}`);

      // Tolerate both JSON and plain-text responses from the n8n flow.
      const raw = await resp.text();
      let reply = "";
      try {
        reply = extractReply(JSON.parse(raw));
      } catch {
        reply = raw;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply.trim() || "Thanks! I didn't catch a response that time — could you rephrase?" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble reaching the assistant. Please try again in a moment." },
      ]);
    }
    setLoading(false);
  };

  return (
    <section id="agent-chat" className="py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          {/* LEFT — Electric agents image */}
          <div className="relative flex">
            <div className="relative rounded-3xl overflow-hidden shadow-xl w-full">
              <img
                src={electricAgents}
                alt="Electrifying the US AI support agents"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Floating badge */}
              <div className="absolute bottom-5 left-5 glass-card rounded-2xl px-5 py-4 animate-float">
                <div className="flex items-center gap-2 text-primary font-bold font-display text-lg">
                  <Sparkles size={20} /> Always On
                </div>
                <div className="text-sm text-muted-foreground">AI agents ready 24/7</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Live chat */}
          <div className="flex flex-col">
            <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Ask Our AI Agent
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground mb-4 leading-tight">
              Chat With <span className="text-gradient-primary">Electrifying the US</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Get instant answers about our programs, electric vehicles, charging, and incentives —
              powered by our AI assistant.
            </p>

            {/* Chat console — "Charge Terminal" HMI style (matches /assistant).
                Fixed height so the messages area scrolls internally instead of
                growing the column and stretching the left image. */}
            <div className="term flex flex-col">
              <div className="term-console term-grain relative flex flex-col h-[600px] rounded-[28px] overflow-hidden">
                {/* Frame bar */}
                <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="term-core relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "radial-gradient(circle at 32% 28%, hsl(var(--term-cyan)), hsl(var(--term-blue)))", boxShadow: "0 0 22px hsl(var(--term-cyan) / 0.45)" }}
                    >
                      <Zap className="w-4 h-4 text-white" fill="currentColor" />
                    </span>
                    <div>
                      <div className="font-hmi font-semibold tracking-wide text-[hsl(var(--term-text))] leading-tight">E-Mobility Assistant</div>
                      <div className="flex items-center gap-1.5 font-term text-[11px] text-[hsl(var(--term-muted))]">
                        <span className="term-live w-2 h-2 rounded-full" style={{ background: "hsl(var(--term-green))" }} /> ONLINE · ask anything e-mobility
                      </div>
                    </div>
                  </div>
                  <span className="font-term text-[10px] tracking-[0.2em] uppercase hidden sm:block text-[hsl(var(--term-muted))]">US Grid · v1</span>
                </div>
                <div className="term-current shrink-0" aria-hidden />

                {/* Messages */}
                <div ref={scrollRef} className="term-scroll relative flex-1 overflow-y-auto p-4 md:p-5">
                  <div className="term-grid absolute inset-0 pointer-events-none" aria-hidden />
                  <div className="relative space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base ${
                            msg.role === "user"
                              ? "rounded-br-md text-white shadow-md"
                              : "rounded-bl-md bg-[hsl(var(--term-panel))] border border-black/[0.06] shadow-sm text-[hsl(var(--term-text))]"
                          }`}
                          style={msg.role === "user" ? { background: "linear-gradient(135deg, hsl(var(--term-blue)), hsl(var(--term-cyan)) 58%, hsl(var(--term-green)))" } : undefined}
                        >
                          <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    {messages.length === 1 && !loading && (
                      <div className="space-y-3 pt-2">
                        <p className="font-term text-[11px] tracking-[0.25em] uppercase px-1 text-[hsl(var(--term-muted))]">▸ Suggested queries</p>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => sendMessage(q)}
                              className="group text-left text-sm px-4 py-3 rounded-xl border border-black/[0.07] bg-[hsl(var(--term-panel))] hover:bg-[hsl(var(--term-cyan)/0.1)] hover:border-[hsl(var(--term-cyan)/0.55)] transition-all text-[hsl(var(--term-text))]"
                            >
                              <span className="font-term text-[hsl(var(--term-cyan))] mr-2">{String(i + 1).padStart(2, "0")}</span>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-[hsl(var(--term-panel))] border border-black/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "hsl(var(--term-cyan))", animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Command bar */}
                <div className="shrink-0 p-3 border-t border-black/[0.06]" style={{ background: "hsl(var(--term-bg))" }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-[hsl(var(--term-panel))] px-2.5 py-1.5 transition-colors focus-within:border-[hsl(var(--term-cyan)/0.55)]"
                  >
                    <span className="font-term text-[hsl(var(--term-cyan))] text-base pl-1 select-none">›</span>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="ask about EVs, charging, incentives…"
                      className="flex-1 bg-transparent text-sm md:text-base outline-none py-2 text-[hsl(var(--term-text))] placeholder:text-[hsl(var(--term-muted))]"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      aria-label="Send message"
                      className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-35 hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, hsl(var(--term-cyan)), hsl(var(--term-green)))" }}
                    >
                      <Send className="w-4 h-4" style={{ color: "hsl(var(--term-bg))" }} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentChatSection;
