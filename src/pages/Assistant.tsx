import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";
import OpenAI from "openai";
import { type Lead, EMPTY_LEAD, isValidEmail } from "@/lib/lead";

type Message = { role: "user" | "assistant"; content: string };

// Lead details are collected before the first query is answered. Held in memory
// only (not persisted) so every visit asks again before the first answer.

// ── Temporary in-browser OpenAI ──────────────────────────────────────────────
// Reads the key from VITE_OPENAI_API_KEY (.env.local). `dangerouslyAllowBrowser`
// is required to call the API from a SPA — DEV/LOCAL ONLY, since the key ships in
// the bundle. For production, route through a server proxy and drop this branch.
const OPENAI_API_KEY = (import.meta as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-5.4-mini";
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

const SYSTEM_PROMPT = `You are the Electrifying the US AI assistant — a friendly, knowledgeable expert on electric vehicles and e-mobility in the United States.

Your expertise includes:
- EV types (BEV, PHEV, HEV), makes, and models
- EV charging (Level 1, 2, DC Fast Charging, NACS/CCS connectors)
- Federal and state EV incentives, tax credits, and rebates
- EV costs, savings, maintenance, and total cost of ownership
- Environmental and public health benefits of EVs
- EV range, battery technology, and cold weather performance
- Multimodal e-mobility: e-bikes, electric buses, eVTOLs, electric ferries, e-scooters
- U.S. EV infrastructure and policy (NEVI program, EPA Clean School Bus, etc.)
- Workforce development in the clean energy sector

Keep answers concise, friendly, and informative. Use bullet points for lists. If you don't know something specific, suggest where they might find the answer (e.g., AFDC, EPA, DOE websites). Always be encouraging about the EV transition.`;

// Curated starter questions with instant, offline-capable answers.
// Free-typed questions still route to the AI backend when configured.
const PRESET_QA: { q: string; a: string }[] = [
  {
    q: "What are the top 5 most affordable EVs?",
    a: "Five of the most affordable EVs in the U.S. (starting MSRP, before incentives):\n- **Nissan LEAF** — around **$29,000**\n- **Chevrolet Equinox EV** — around **$34,000**\n- **Hyundai Kona Electric** — around **$33,000**\n- **Kia Niro EV** — around **$40,000** (often discounted)\n- **Chevrolet Bolt EV/EUV** (returning for 2026) — around **$30,000**\n\nPrices change often, and the **federal Clean Vehicle Credit** plus state and utility rebates can lower these further. Try the **[TCO Calculator](/calculator)** to compare real ownership cost.",
  },
  {
    q: "What is Electrifying the US?",
    a: "**Electrifying the US** is a brand-agnostic initiative accelerating America's shift to zero-emission, multimodal mobility. We unite utilities, automakers, community organizations, and labor unions to educate and engage the public.\n\nWhat we do:\n- Hands-on **EV Ride & Drive** experiences\n- E-mobility **workforce upskilling** & economic inclusion\n- **Public-health education** on zero-emission transportation\n- Mobility **research, data & analysis**\n\nWe work nationwide, with state programs like [Electrifying Virginia](https://www.electrifyingva.com/) and [Electrifying Michigan](https://www.electrifyingmi.com/).",
  },
  {
    q: "What EV tax credits & incentives can I get?",
    a: "Incentives can meaningfully cut your cost:\n- **Federal:** up to **$7,500** for a qualifying new EV and up to **$4,000** for a used EV (income, price, and assembly rules apply)\n- **State & local:** many states add rebates, reduced registration, or HOV-lane access\n- **Utilities:** rebates for home chargers and off-peak charging\n\nEligibility changes often — check the official [AFDC incentive search](https://afdc.energy.gov/laws) and [IRS Clean Vehicle Credit](https://www.irs.gov/) for your exact ZIP and situation.",
  },
  {
    q: "How much can I save by switching to an EV?",
    a: "EVs are usually cheaper to own than gas cars:\n- **~60% cheaper to 'fuel'** — charging costs far less per mile than gasoline\n- **Lower maintenance** — no oil changes, fewer moving parts, less brake wear\n- **Incentives** can take thousands off the purchase price\n\nYour savings depend on miles driven and local electricity vs. gas prices. Try the **[TCO Calculator](/calculator)** on this site for a personalized estimate.",
  },
  {
    q: "What are the EV charging levels?",
    a: "There are three main ways to charge:\n- **Level 1 (120V):** standard wall outlet, ~3–5 miles of range per hour — fine for overnight top-ups\n- **Level 2 (240V):** home or public station, ~20–40 miles per hour — the everyday standard\n- **DC Fast Charging:** public stations, **10–80% in ~20–40 min** — great for road trips\n\nConnectors are moving toward the **NACS** standard (Tesla-style), with **CCS** still widely used. The U.S. now has **240K+ public charging ports** and growing.",
  },
  {
    q: "How can I get involved or partner with you?",
    a: "We'd love to work with you! Ways to engage:\n- **Attend a Ride & Drive** to test EVs hands-on\n- **Workforce programs** — training and clean-energy career pathways\n- **Partner with us** — utilities, automakers, employers, and community groups\n\nReach out at **info@electrifyingtheus.com** or use the **Contact** form on the home page. You can also explore [Electrifying VA](https://www.electrifyingva.com/) and [Electrifying MI](https://www.electrifyingmi.com/).",
  },
  {
    q: "How far can an EV go on a full charge?",
    a: "Plenty for everyday driving:\n- Most new EVs deliver **250–330 miles** of range; the U.S. average is around **283 miles**\n- The typical American drives under **40 miles a day** — well within a single charge\n- Range varies with speed, climate, terrain, and cargo\n\nFor road trips, DC fast chargers add **150–200+ miles in ~20–30 minutes**. \"Range anxiety\" fades fast once charging becomes routine.",
  },
  {
    q: "Are EVs really better for the environment?",
    a: "Yes — over their lifetime, clearly:\n- EVs produce **zero tailpipe emissions**, improving local air quality and public health\n- Even on today's mixed grid, a typical EV creates **far fewer lifetime emissions** than a comparable gas car\n- They get **cleaner over time** as the grid adds more renewables\n\nFewer emissions also means fewer respiratory and cardiovascular health impacts in our communities.",
  },
  {
    q: "How do EVs perform in cold weather?",
    a: "They work well — with a few winter notes:\n- Expect **10–30% less range** in freezing temps (cabin heating is the main draw)\n- **Preconditioning** while plugged in warms the battery & cabin without using driving range\n- Battery thermal management keeps packs healthy in the cold\n\nMillions of EVs operate happily in northern climates year-round — see our **EV in Winter** section for tips.",
  },
  {
    q: "How long do EV batteries last?",
    a: "Longer than most people expect:\n- Modern EV batteries are built to last **10–20 years** or **150,000–200,000+ miles**\n- They're covered by a federally mandated **8-year / 100,000-mile warranty** (longer in some states)\n- Degradation is gradual — typically just **1–2% of range per year**\n\nRetired packs are increasingly **reused for energy storage and recycled** for their materials.",
  },
];

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) =>
    href?.startsWith("/") ? (
      <Link to={href} className="underline font-medium text-[hsl(188_92%_30%)]">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline font-medium text-[hsl(188_92%_30%)]">{children}</a>
    ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-[hsl(184_76%_38%)]">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
};

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi, I'm EVan, your EV Concierge. My team and I, are currently online, ready to answer your questions about Electric Vehicles, EV Cost Savings, EV Charging and Infrastructure, Rebates & Incentives programs, and more. I've added the top 10 questions below. Enter your first name and email, and let's get started." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<Lead>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  // A question the visitor asked/clicked before giving details — answered the
  // moment the lead is captured. `a` is a preset answer, or null for AI.
  const [pending, setPending] = useState<{ q: string; a: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the chat scrolled to the latest message — without scrolling the whole page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Lead capture gate — collected only after the visitor picks/asks a question.
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

    const held = pending;
    setPending(null);
    if (held) deliver(held);
  };

  // Deliver a held question once we have a lead: instant preset, or AI.
  const deliver = (item: { q: string; a: string | null }) => {
    if (item.a !== null) {
      setMessages((prev) => [...prev, { role: "user", content: item.q }]);
      setLoading(true);
      const answer = item.a;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
        setLoading(false);
      }, 450);
    } else {
      runAI(item.q);
    }
  };

  // Clicking a preset question — gate on lead first, then answer instantly.
  const handlePreset = (q: string, a: string) => {
    if (loading) return;
    if (!lead) { setPending({ q, a }); return; }
    deliver({ q, a });
  };

  // Free-typed send — gate on lead first.
  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!lead) { setPending({ q: text, a: null }); setInput(""); return; }
    runAI(text);
  };

  // Core AI path — appends the user message and streams a reply.
  const runAI = async (text: string) => {
    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    // Functional append so an immediately-preceding greeting isn't clobbered.
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Personalize: let the assistant address the visitor by first name.
    const firstName = lead?.fullName.trim().split(/\s+/)[0];
    const systemPrompt = firstName
      ? `${SYSTEM_PROMPT}\n\nThe visitor's first name is ${firstName}. Address them by their first name naturally and warmly in your responses.`
      : SYSTEM_PROMPT;

    try {
      // Preferred path: answer any question with OpenAI directly (temporary, in-browser).
      if (openai) {
        const convo: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...allMessages.map((m) => ({ role: m.role, content: m.content })),
        ];

        let assistantSoFar = "";
        let appended = false;
        const stream = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: convo,
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;
          assistantSoFar += delta;
          setMessages((prev) => {
            if (!appended) {
              appended = true;
              return [...prev, { role: "assistant", content: assistantSoFar }];
            }
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          });
        }

        setLoading(false);
        return;
      }

      const supabaseUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        // Try to answer from the curated set; otherwise show demo-mode help.
        const preset = PRESET_QA.find((p) => p.q.toLowerCase() === userMsg.content.toLowerCase());
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              preset?.a ??
              "I'm currently running in demo mode. To enable full AI-powered responses, the site needs a backend connection. In the meantime, tap one of the suggested questions, or visit [AFDC](https://afdc.energy.gov/) for comprehensive EV info!",
          },
        ]);
        setLoading(false);
        return;
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...allMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > allMessages.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIdx);
          textBuffer = textBuffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { /* ignore malformed SSE line */ }
        }
      }
    } catch (err) {
      const detail =
        err instanceof OpenAI.AuthenticationError
          ? "the API key looks invalid — check `VITE_OPENAI_API_KEY` in `.env.local` and restart the dev server."
          : err instanceof OpenAI.RateLimitError
            ? "we're being rate-limited right now. Please try again in a moment."
            : "I had trouble connecting. Please try again in a moment!";
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, ${detail}` }]);
    }
    setLoading(false);
  };

  // 10 questions show FIRST (before any lead). The lead form only appears once a
  // visitor picks/asks a question, which we hold in `pending`.
  const showSuggestions = !pending && !loading && messages.every((m) => m.role === "assistant");
  const showLeadForm = !lead && !!pending && !loading;
  const TXT = "text-[hsl(var(--term-text))]";
  const MUTED = "text-[hsl(var(--term-muted))]";

  return (
    <div className="term min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background to-secondary/5">
      <div className="term-glow" aria-hidden />
      <Navbar />
      <div className="relative z-10 pt-28 pb-16 flex-1">
        <div className="container px-4 max-w-3xl">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* HMI header — energy core + identity + status */}
          <div className="text-center mb-9">
            <div className="term-rise inline-flex flex-col items-center">
              <span
                className="term-core relative inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{
                  background: "radial-gradient(circle at 32% 28%, hsl(var(--term-cyan)), hsl(var(--term-blue)))",
                  boxShadow: "0 0 44px hsl(var(--term-cyan) / 0.5)",
                }}
              >
                <Zap className="w-7 h-7 text-white" fill="currentColor" />
              </span>
              <span className="text-[11px] tracking-[0.2em] font-semibold text-muted-foreground uppercase">E-Mobility Concierge</span>
              <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground tracking-tight mt-1.5">
                Talk to EVan
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="term-live w-2 h-2 rounded-full" style={{ background: "hsl(var(--term-green))" }} />
                ONLINE · grid-aware
              </div>
            </div>
          </div>

          {/* The console */}
          <div className="term-rise term-console term-grain relative rounded-[28px] overflow-hidden flex flex-col h-[640px] max-h-[76vh]" style={{ animationDelay: "0.12s" }}>
            {/* Frame bar */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--term-cyan)), hsl(var(--term-green)))" }}>
                  <Zap className="w-4 h-4" style={{ color: "hsl(var(--term-bg))" }} fill="currentColor" />
                </span>
                <span className={`font-hmi font-semibold tracking-wide ${TXT}`}>E-Mobility Concierge</span>
              </div>
            </div>
            <div className="term-current shrink-0" aria-hidden />

            {/* Messages */}
            <div ref={scrollRef} className="term-scroll relative flex-1 overflow-y-auto p-4 md:p-6">
              <div className="term-grid absolute inset-0 pointer-events-none" aria-hidden />
              <div className="relative space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base ${
                        msg.role === "user"
                          ? "rounded-br-md text-white shadow-md"
                          : `rounded-bl-md bg-[hsl(var(--term-panel))] border border-black/[0.06] shadow-sm ${TXT}`
                      }`}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, hsl(var(--term-blue)), hsl(var(--term-cyan)) 58%, hsl(var(--term-green)))" } : undefined}
                    >
                      <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {/* Lead capture gate — shown after a question is picked. */}
                {showLeadForm && (
                  <form onSubmit={captureLead} className="space-y-3 pt-2">
                    <p className={`text-[11px] tracking-[0.2em] font-semibold uppercase px-1 ${MUTED}`}>▸ A few quick details</p>
                    <p className={`text-sm ${TXT}`}>Tell me a bit about you and I'll tailor the answer.</p>
                    {(() => {
                      const fc = `w-full rounded-xl border border-black/[0.08] bg-[hsl(var(--term-panel))] px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--term-cyan)/0.55)] placeholder:text-[hsl(var(--term-muted))] ${TXT}`;
                      return (
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          <input type="text" value={leadForm.fullName} onChange={(e) => setLeadForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="First name *" autoComplete="given-name" className={fc} />
                          <input type="email" value={leadForm.email} onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email address *" autoComplete="email" className={fc} />
                        </div>
                      );
                    })()}
                    {leadError && <p className="text-xs text-red-500 px-1">{leadError}</p>}
                    <button
                      type="submit"
                      className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, hsl(var(--term-blue)), hsl(var(--term-cyan)) 58%, hsl(var(--term-green)))" }}
                    >
                      Get my answer →
                    </button>
                    <p className={`text-[11px] px-1 leading-relaxed ${MUTED}`}>
                      We use this only to personalize your answers and follow up. No spam.
                    </p>
                  </form>
                )}

                {/* 10 EV questions */}
                {showSuggestions && (
                  <div className="space-y-3 pt-2">
                    <p className={`font-term text-[11px] tracking-[0.25em] uppercase px-1 ${MUTED}`}>▸ 10 EV Questions</p>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {PRESET_QA.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handlePreset(item.q, item.a)}
                          className={`group text-left text-sm px-4 py-3 rounded-xl border border-black/[0.07] bg-[hsl(var(--term-panel))] hover:bg-[hsl(var(--term-cyan)/0.1)] hover:border-[hsl(var(--term-cyan)/0.55)] transition-all ${TXT}`}
                        >
                          <span className="font-term text-[hsl(var(--term-cyan))] mr-2">{String(i + 1).padStart(2, "0")}</span>
                          {item.q}
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
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-[hsl(var(--term-panel))] px-2.5 py-1.5 transition-colors focus-within:border-[hsl(var(--term-cyan)/0.55)]"
              >
                <span className="font-term text-[hsl(var(--term-cyan))] text-base pl-1 select-none">›</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lead ? "Ask me about EVs, Charging, Range, and more" : "enter your name + email above to start…"}
                  className={`flex-1 bg-transparent text-sm md:text-base outline-none py-2 placeholder:text-[hsl(var(--term-muted))] ${TXT}`}
                  disabled={loading || !lead}
                />
                <button
                  type="submit"
                  disabled={loading || !lead || !input.trim()}
                  aria-label="Send"
                  className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-35 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, hsl(var(--term-cyan)), hsl(var(--term-green)))" }}
                >
                  <Send className="w-4 h-4" style={{ color: "hsl(var(--term-bg))" }} />
                </button>
              </form>
            </div>
          </div>

          {/* Powered by credit */}
          <p className="font-term text-center text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Assistant;
