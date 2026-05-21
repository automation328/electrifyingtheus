import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

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
    q: "How long does it take to charge an EV?",
    a: "It depends on the charger:\n- **Level 1 (120V):** ~3–5 mi of range per hour — overnight trickle\n- **Level 2 (240V):** full charge in **~4–8 hours** — most home & workplace charging\n- **DC Fast Charging:** **10–80% in ~20–40 minutes**\n\nMost EV owners simply plug in at home and wake up to a \"full tank\" — no gas-station trips needed.",
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
      <Link to={href} className="underline font-medium text-primary">{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline font-medium text-primary">{children}</a>
    ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
};

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! ⚡ I'm your e-mobility assistant. Ask me anything about electric vehicles, charging, incentives, or the future of clean transportation in the U.S. — or tap a question below to get started." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the chat scrolled to the latest message — without scrolling the whole page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Instant answer for a clicked preset question (no backend needed).
  const handlePreset = (q: string, a: string) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: a }]);
      setLoading(false);
    }, 450);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
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
            { role: "system", content: SYSTEM_PROMPT },
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble connecting. Please try again in a moment!" },
      ]);
    }
    setLoading(false);
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background to-secondary/5">
      <Navbar />
      <div className="pt-28 pb-16 flex-1">
        <div className="container px-4 max-w-4xl">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Title pill */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-3 glass-card rounded-full pl-3 pr-6 py-2.5 animate-fade-up">
              <span className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center shrink-0">
                <Zap className="text-white" size={20} />
              </span>
              <span className="font-display font-bold tracking-wide text-foreground text-lg md:text-2xl uppercase">
                Electric Vehicle Assistant
              </span>
            </div>
          </div>

          {/* Two-line intro */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <p className="text-primary font-semibold text-lg md:text-xl">
              Got questions about EVs? Need personalized recommendations?
            </p>
            <p className="text-secondary font-semibold text-lg md:text-xl mt-1">
              Our AI assistant can give you answers to anything you want to know!
            </p>
          </div>

          {/* Chat box with brand gradient border (blue → green) */}
          <div className="rounded-[28px] p-[2px] gradient-hero shadow-2xl">
            <div className="rounded-[26px] bg-card overflow-hidden flex flex-col h-[600px] max-h-[72vh]">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base ${
                      msg.role === "user"
                        ? "gradient-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}

              {/* Suggested starter questions (shown before first interaction) */}
              {showSuggestions && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-muted-foreground px-1">⚡ Top 10 questions — tap to ask</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PRESET_QA.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handlePreset(item.q, item.a)}
                        className="text-left text-sm px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        {item.q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about EVs, charging, incentives…"
                  className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={loading}
                />
                <Button type="submit" size="icon" variant="default" className="rounded-xl shrink-0 h-12 w-12" disabled={loading || !input.trim()}>
                  <Send size={18} />
                </Button>
              </form>
            </div>
            </div>
          </div>

          {/* Powered by credit */}
          <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Powered by{" "}
            <a
              href="https://www.evhybridnoire.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              EV Hybrid Noire
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Assistant;
