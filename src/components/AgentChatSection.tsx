import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Zap, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import evanPortrait from "@/assets/evan.jpg";

import { type Lead, EMPTY_LEAD, isValidEmail } from "@/lib/lead";

type Message = { role: "user" | "assistant"; content: string };

// Lead details are collected before the first query is answered. Held in memory
// only (not persisted) so every visit asks again before the first answer.

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
  "Hi, I'm EVan, your EV Concierge. My team and I, are currently online, ready to answer your questions about Electric Vehicles, EV Cost Savings, EV Charging and Infrastructure, Rebates & Incentives programs, and more. I've added the top 10 questions below. Enter your first name and email, and let's get started.";

// 10 clickable EV questions — drawn from the EVNoire EV Charging 101 knowledge base.
const SUGGESTED_QUESTIONS = [
  "What are the top 5 most affordable EVs?",
  "What's the difference between a hybrid and a fully electric vehicle?",
  "How long do EV batteries last?",
  "Can I charge an EV at home — and what do I need?",
  "How much does it cost to charge an EV at home?",
  "Where can I find public charging stations?",
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
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<Lead>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  // The question a visitor asked before giving their details — answered the
  // moment the lead is captured.
  const [pending, setPending] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the conversation pinned to the newest message without moving the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Actually deliver a question to the n8n agent and render the reply. The
  // lead is passed in explicitly so it works on the same tick it's captured.
  const doSend = async (text: string, leadInfo: Lead) => {
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
          firstName: leadInfo.fullName.split(/\s+/)[0],
          ...leadInfo,
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

  // Questions are shown first. The first time a visitor sends/clicks one without
  // a saved lead, hold it and surface the name + email gate.
  const sendMessage = (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    if (!lead) {
      setPending(text);
      setInput("");
      return;
    }
    doSend(text, lead);
  };

  // Lead capture gate — first name + email collected before the held question
  // is answered.
  const captureLead = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = leadForm.fullName.trim();
    const email = leadForm.email.trim();
    if (!fullName) { setLeadError("Please enter your first name."); return; }
    if (!isValidEmail(email)) { setLeadError("Please enter a valid email address."); return; }

    const captured: Lead = { fullName, email };
    setLead(captured);
    setLeadError("");

    // Greet the visitor by first name before answering their held question.
    const firstName = fullName.split(/\s+/)[0];
    setMessages((prev) => [...prev, { role: "assistant", content: `Thank you, ${firstName}! Let me pull that up for you.` }]);

    // Best-effort: notify the n8n flow that a new lead was captured.
    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "captureLead", sessionId, firstName, ...captured }),
      }).catch(() => { /* non-blocking */ });
    }

    const q = pending;
    setPending(null);
    if (q) doSend(q, captured);
  };

  return (
    <section id="agent-chat" className="py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
          {/* LEFT — Electric agents image */}
          <div className="relative flex">
            <div className="relative rounded-3xl overflow-hidden shadow-xl w-full">
              <img
                src={evanPortrait}
                alt="EVan, your Electrifying the US E-Mobility Concierge"
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
              Ask our team of E-Mobility Experts
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground mb-4 leading-tight">
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent whitespace-nowrap">EVan</span> - Your Electric Vehicle Concierge
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Here to answer all your EV Questions
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
                      <div className="font-hmi font-semibold tracking-wide text-[hsl(var(--term-text))] leading-tight">E-Mobility Concierge</div>
                      <div className="flex items-center gap-1.5 font-term text-[11px] text-[hsl(var(--term-muted))]">
                        <span className="term-live w-2 h-2 rounded-full" style={{ background: "hsl(var(--term-green))" }} /> ONLINE
                      </div>
                    </div>
                  </div>
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

                    {/* Top 10 EV questions — shown first, before the lead gate. */}
                    {!pending && messages.every((m) => m.role === "assistant") && !loading && (
                      <div className="space-y-3 pt-2">
                        <p className="font-term text-[11px] tracking-[0.25em] uppercase px-1 text-[hsl(var(--term-muted))]">▸ 10 EV Questions</p>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => sendMessage(q)}
                              className="group text-left text-sm px-4 py-3 rounded-xl text-[hsl(var(--term-text))] shadow-sm hover:brightness-95 transition-all"
                              style={{ background: "#e3eeea" }}
                            >
                              <span className="font-term text-secondary mr-2">{String(i + 1).padStart(2, "0")}</span>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lead capture gate — first name + email collected before the held question is answered. */}
                    {!lead && pending && !loading && (
                      <form onSubmit={captureLead} className="space-y-3 pt-2">
                        <p className="font-term text-[11px] tracking-[0.25em] uppercase px-1 text-[hsl(var(--term-muted))]">▸ A few quick details</p>
                        <p className="text-sm text-[hsl(var(--term-text))]">
                          Tell me a bit about you and I'll tailor the answer.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={leadForm.fullName}
                            onChange={(e) => setLeadForm((f) => ({ ...f, fullName: e.target.value }))}
                            placeholder="First name *"
                            autoComplete="given-name"
                            className="w-full rounded-xl border border-black/[0.08] bg-[hsl(var(--term-panel))] px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--term-cyan)/0.55)] text-[hsl(var(--term-text))] placeholder:text-[hsl(var(--term-muted))]"
                          />
                          <input
                            type="email"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="Email address *"
                            autoComplete="email"
                            className="w-full rounded-xl border border-black/[0.08] bg-[hsl(var(--term-panel))] px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--term-cyan)/0.55)] text-[hsl(var(--term-text))] placeholder:text-[hsl(var(--term-muted))]"
                          />
                        </div>
                        {leadError && <p className="text-xs text-red-500 px-1">{leadError}</p>}
                        <button
                          type="submit"
                          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, hsl(var(--term-blue)), hsl(var(--term-cyan)) 58%, hsl(var(--term-green)))" }}
                        >
                          Get my answer →
                        </button>
                        <p className="text-[11px] text-[hsl(var(--term-muted))] px-1 leading-relaxed">
                          We use this only to personalize your answers and follow up. No spam.
                        </p>
                      </form>
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
                      placeholder="Ask me about EVs, Charging, Range, and more"
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

            {/* Powered-by credit */}
            <p className="text-xs text-muted-foreground mt-4 text-center lg:text-left">
              Powered by{" "}
              <a
                href="https://emobilityresearch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                EmobilityResearch.com
              </a>
            </p>

            {/* "Put EVan on your own site" CTA */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-foreground">Would you like to have EVan or other EV tools on your website?</p>
                <p className="text-sm text-muted-foreground">
                  Answering EV questions and providing real-time data. Click here to add the
                  E-Mobility Concierge to your website and engage your visitors.
                </p>
              </div>
              <Link to="/contact-us" className="shrink-0">
                <Button variant="green" className="rounded-xl">
                  <Sparkles className="w-4 h-4" /> Add EVan to my site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentChatSection;
