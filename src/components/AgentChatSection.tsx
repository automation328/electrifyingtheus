import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Zap, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  "What Are the Top 5 Most Affordable New EVs for 2026?",
  "How far can you drive on a single charge?",
  "Do EVs require more maintenance than gas vehicles?",
  "Can you drive an EV on a long trip?",
  "How long does it take to charge an EV?",
  "What's the difference between a hybrid and an electric vehicle?",
  "How will charging an EV affect my electric bill?",
  "How long do EV batteries last?",
  "Can I charge an EV at home — and what do I need?",
  "What EV tax credits and incentives are available?",
];

// ── Canned answers ───────────────────────────────────────────────────────────
// A handful of questions have an exact, editorially-approved answer that must be
// returned word-for-word. These short-circuit the n8n agent so the copy never
// drifts. Keyed by a normalized question string (lowercase, alphanumeric only).
const normalizeQ = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

// Appended whenever EVan can't answer — points the visitor to the floating
// Contact Us widget (bottom-right) so a human can follow up.
const CONTACT_HINT =
  "\n\nIf I couldn't fully answer that, tap the **Contact Us** button at the bottom-right of your screen and our team will help you directly.";

// `{name}` is replaced with the visitor's first name at send time (see doSend).
const TOP_5_AFFORDABLE_EVS = `Great question {name}! The good news: going electric doesn't have to break the bank. For context, the average price of a new gas-powered vehicle in the US is now **$50,000+**, and pre-owned vehicles average **$26,000+** nationwide. Against that backdrop, these five EVs represent some of the best value on the market today. Here are the most affordable new electric vehicles you can buy right now — ranked by starting price, before taxes, fees, or any available **[incentives](/rebates-incentives)** that could lower your cost even further.

Want to dig into the numbers? Compare any two cars in the **[EV vs Gas Cost Calculator](/electricity-vs-gasoline)**, see what you qualify for under **[Incentives](/rebates-incentives)**, and locate stations near you with **[Find a Charger](/find-a-charger)**.

### 🔋 Top 5 Most Affordable New EVs (2026)

| Model | Starting MSRP | Range | Drive Type |
| --- | --- | --- | --- |
| Nissan Leaf S | $29,000 | 149 mi | FWD |
| Mini Cooper Electric | $31,000 | 180–250 mi | FWD |
| Hyundai Kona Electric | $34,000 | 200–260 mi | FWD |
| Chevrolet Equinox EV | $35,000 | 250–319 mi | FWD / AWD |
| Volvo EX30 | $36,000 | 200–275 mi | RWD / AWD |

### ⚡ Charging at a Glance

| Model | Level 2 Home Charging | DC Fast Charging |
| --- | --- | --- |
| Nissan Leaf S | ~25–30 mi/hr | 20%→80% in ~40–45 min |
| Mini Cooper Electric | ~25–30 mi/hr | 10%→80% in ~30 min |
| Hyundai Kona Electric | ~30–35 mi/hr | 10%→80% in ~40 min |
| Chevrolet Equinox EV | ~30–35 mi/hr | 10%→80% in ~35 min |
| Volvo EX30 | ~30–35 mi/hr | 10%→80% in ~27 min |

Level 2 home charging uses a standard 240V charger. Fast charging times vary based on battery temperature and charger availability. Locate nearby stations with **[Find a Charger](/find-a-charger)**.

### 🏆 Our Top Picks & Why

**🥇 Best Overall Value — Chevrolet Equinox EV (~$35,000)**
The Equinox EV punches well above its price tag. With up to 319 miles of range, SUV-sized space, and access to a growing charging network, it's the most well-rounded affordable EV on this list. Ideal for families, commuters, rideshare drivers, and first-time EV buyers alike.

**🥈 Best Premium Feel for the Price — Volvo EX30 (~$36,000)**
If you want a sophisticated, fast-charging EV that feels like it costs twice as much, the EX30 delivers. It has the fastest charging on this list and impressive acceleration — just know the cargo space is compact.

**🥉 Best Proven Reliability — Hyundai Kona Electric (~$34,000)**
The Kona Electric has a strong track record, solid range, and easy maneuverability. A dependable choice if you want an EV from a brand with a long history of building them right.

### 💡 Want to Stretch Your Budget Further? Consider Pre-Owned.

A used EV can be an incredible value:

| Model | Typical Used Price | Why It's Worth a Look |
| --- | --- | --- |
| Chevrolet Bolt EV (2020–2023) | $13,000–$22,000 | Best bang for the buck — 259 mi range at a bargain price |
| Nissan Leaf Plus | $12,000–$20,000 | Reliable, widely available |
| Hyundai Kona Electric | $18,000–$28,000 | Proven model with good resale value |
| Tesla Model 3 (2018–2021) | $16,000–$25,000 | Great range and charging network access |
| Kia Niro EV | $18,000–$27,000 | Practical, efficient, and comfortable |

The used **Chevrolet Bolt EV** is currently one of the best EV bargains in America — solid range, low price, and widely available.

Ready to run your own numbers? Try the **[EV vs Gas Cost Calculator](/electricity-vs-gasoline)** and check your **[Incentives](/rebates-incentives)**.`;

const EV_RANGE_ANSWER = `The range of an EV — how many miles it can travel on a full charge — varies by model. Current models offer an EPA-rated range from about **150 miles** for entry-level vehicles to over **500+ miles** for some premium models.

Most popular EVs in the U.S. today — such as the **Tesla Model 3**, **Model Y**, **Chevy Equinox EV**, and **Ford Mustang Mach-E** — typically provide **250–330 miles** of range. For context, the average American drives about **37 miles per day**, well within the range of nearly every EV available.`;

const EV_CHARGING_TIME_ANSWER = `Charging an EV fits naturally into most daily routines — most drivers simply plug in when they get home, just like a laptop, iPad, or mobile phone, and wake up to a full charge every morning. When you're on the road and need a quick top-off, a DC fast charger can take you from nearly empty to 80% in about **15–40 minutes** — often about the time it takes to grab a coffee and stretch your legs. Think of it like your phone or tablet: whether you plug in at 5% or 60%, the higher your battery level, the less time it takes to reach a full charge.

The time it takes depends on the charging level, battery size, and state of charge when you begin. Here's a breakdown:

| Charging Level | Speed | Full Charge | Best For |
| --- | --- | --- | --- |
| **Level 1** — 120V household outlet | ~3–5 mi range/hour | Overnight, from empty | Shorter commutes |
| **Level 2** — 240V home charger | ~20–60 mi range/hour | 4–8 hours (60–80 kWh battery) | Everyday home charging |
| **DC Fast Charging** — public stations | Fastest available | ~80% in 15–30 min | Road trips & quick top-offs |

For daily driving, most EV owners charge to about **80%**, and only to 100% for longer trips.

**Note:** The average American drives less than **35 miles per day**. If your EV has a 300-mile range, you likely won't need to charge every single day. It's less a technical adjustment and more a simple shift in habit — one that most EV owners say quickly becomes second nature.`;

const CANNED_ANSWERS: Record<string, string> = {
  [normalizeQ(SUGGESTED_QUESTIONS[0])]: TOP_5_AFFORDABLE_EVS,
  [normalizeQ(SUGGESTED_QUESTIONS[1])]: EV_RANGE_ANSWER,
  [normalizeQ(SUGGESTED_QUESTIONS[4])]: EV_CHARGING_TIME_ANSWER,
};

// Return the exact canned answer for a question, or null to fall through to n8n.
// `{name}` is interpolated with the visitor's first name (falls back to a warm
// generic when unknown).
const cannedAnswerFor = (text: string, firstName?: string): string | null => {
  const key = normalizeQ(text);
  const personalize = (s: string) => s.replace(/\{name\}/g, firstName?.trim() || "there");
  if (CANNED_ANSWERS[key]) return personalize(CANNED_ANSWERS[key]);
  // Looser matches so typed variants still hit the curated answers.
  if (key.includes("ev") && (key.includes("affordable") || key.includes("cheapest"))) {
    return personalize(TOP_5_AFFORDABLE_EVS);
  }
  if (key.includes("howfar") || key.includes("howmanymiles") || (key.includes("range") && key.includes("ev"))) {
    return personalize(EV_RANGE_ANSWER);
  }
  if ((key.includes("howlong") && key.includes("charge")) || (key.includes("charging") && key.includes("time"))) {
    return personalize(EV_CHARGING_TIME_ANSWER);
  }
  return null;
};

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
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="font-display font-bold text-base mt-3 mb-1.5 first:mt-0">{children}</h3>,
  h4: ({ children }: { children?: React.ReactNode }) => <h4 className="font-term text-[11px] tracking-[0.2em] uppercase mt-3 mb-1 text-[hsl(var(--term-cyan))]">{children}</h4>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-black/[0.08]">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-[hsl(var(--term-bg))]">{children}</thead>,
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-black/[0.06] last:border-0">{children}</tr>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="text-left font-semibold px-2.5 py-1.5 whitespace-nowrap text-[hsl(var(--term-text))]">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="px-2.5 py-1.5 align-top text-[hsl(var(--term-text))]">{children}</td>,
};

// Render the conversation as a readable transcript for the GHL note.
const buildTranscript = (msgs: Message[]) =>
  msgs.map((m) => `${m.role === "user" ? "Visitor" : "EVan"}: ${m.content}`).join("\n\n");

// Upsert the chatbot lead into GoHighLevel via the secure /api/lead proxy.
// Tagged `chatbot-lead` (see api/lead.ts). Fire-and-forget — never blocks chat.
const pushChatLeadToGHL = (lead: Lead) => {
  try {
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        formType: "evan-chat",
        firstName: lead.fullName.split(/\s+/)[0],
        email: lead.email,
        sessionId,
      }),
    }).catch(() => { /* best-effort */ });
  } catch { /* best-effort */ }
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

  // Refs let the unload listener read the latest lead + transcript without
  // re-binding on every message.
  const leadRef = useRef<Lead | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const transcriptSentLenRef = useRef(0);
  useEffect(() => { leadRef.current = lead; }, [lead]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Save the full conversation to the GHL contact as a single note when the
  // visitor leaves. Uses sendBeacon so it survives the page unload. Guarded by
  // transcript length so a tab-switch mid-chat doesn't spam duplicate notes.
  useEffect(() => {
    const flushTranscript = () => {
      const l = leadRef.current;
      const msgs = messagesRef.current;
      if (!l) return;
      if (!msgs.some((m) => m.role === "user")) return;          // nothing asked yet
      const transcript = buildTranscript(msgs);
      if (transcript.length <= transcriptSentLenRef.current) return;
      transcriptSentLenRef.current = transcript.length;
      const payload = JSON.stringify({
        formType: "evan-chat",
        firstName: l.fullName.split(/\s+/)[0],
        email: l.email,
        sessionId,
        transcript,
      });
      try {
        navigator.sendBeacon("/api/lead", new Blob([payload], { type: "application/json" }));
      } catch { /* best-effort */ }
    };
    const onHide = () => { if (document.visibilityState === "hidden") flushTranscript(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushTranscript);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushTranscript);
    };
  }, []);

  // Actually deliver a question to the n8n agent and render the reply. The
  // lead is passed in explicitly so it works on the same tick it's captured.
  const doSend = async (text: string, leadInfo: Lead) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // Editorially-approved answers return verbatim, rendered locally without
    // touching the agent. The Q&A is captured in the transcript that's saved to
    // the GHL contact at chat close — no per-message logging needed.
    const canned = cannedAnswerFor(text, leadInfo.fullName.split(/\s+/)[0]);
    if (canned) {
      setMessages((prev) => [...prev, { role: "assistant", content: canned }]);
      setLoading(false);
      return;
    }

    try {
      if (!N8N_WEBHOOK_URL) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm running in **demo mode** right now — the AI agent isn't connected yet. Once the team sets the n8n webhook, I'll answer your questions live. In the meantime, explore the site, or tap the **Contact Us** button at the bottom-right of your screen and our team will help you directly.",
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
        { role: "assistant", content: reply.trim() || `Thanks! I didn't catch a response that time — could you rephrase?${CONTACT_HINT}` },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I had trouble reaching the assistant. Please try again in a moment.${CONTACT_HINT}` },
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

    // Upsert the lead into GoHighLevel immediately (tagged `chatbot-lead`). The
    // full transcript is attached as a note — and the single Slack alert fires —
    // when the visitor leaves (see the transcript-flush effect above).
    pushChatLeadToGHL(captured);

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
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.content}</ReactMarkdown>
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
