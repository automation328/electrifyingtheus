import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play, Fuel, PlugZap, ArrowRight, ArrowUpRight,
  MessageCircle, Calculator, BadgeCheck, Plug, Ticket,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VIDEO_ID = "WaIWh8wY_tI";
const INK = "#0A1A2F";
const PUMP = "#E8943A";

// ── Click-to-play webinar player ────────────────────────────────────────────
const WebinarVideo = () => {
  const [play, setPlay] = useState(false);
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-2xl md:rounded-3xl shadow-elevated ring-1 ring-black/10"
      style={{ background: INK }}
    >
      {play ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
          title="Webinar Series Part 1: From The Pump To The Plug"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label="Play the webinar replay"
          className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
        >
          <img
            src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`; }}
          />
          <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,26,47,0.82), rgba(10,26,47,0.15) 45%, rgba(10,26,47,0.35))" }} aria-hidden />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white text-[#0A1A2F] shadow-2xl transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 h-8 w-8 fill-current" />
            </span>
          </span>
          <span className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/75">
            ▸ Replay · Part 01
          </span>
        </button>
      )}
    </div>
  );
};

// ── Itemized "what you'll learn" receipt rows ───────────────────────────────
const LEARN: { label: string; value: string }[] = [
  { label: "Fuel", value: "far cheaper per mile than gas" },
  { label: "Maintenance", value: "no oil changes, fewer parts" },
  { label: "Incentives", value: "federal, state & utility" },
  { label: "Charging", value: "home + public, made simple" },
  { label: "Who it's for", value: "commuters & families" },
];

// ── Next-stop navigation cards ──────────────────────────────────────────────
type Stop = { icon: typeof Plug; title: string; desc: string; to: string; external?: boolean };
const STOPS: Stop[] = [
  { icon: MessageCircle, title: "Ask EVan", desc: "Your EV Advisor — instant answers on EVs, charging, and savings, 24/7.", to: "/#agent-chat", external: true },
  { icon: Calculator, title: "EV vs Gas Calculator", desc: "Compare any EV against the car you drive today on real U.S. costs.", to: "/electricity-vs-gasoline" },
  { icon: BadgeCheck, title: "Rebates & Incentives", desc: "Find the federal, state, and utility programs you qualify for.", to: "/rebates-incentives" },
  { icon: Plug, title: "Find a Charger", desc: "Locate charging stations near you and along your route.", to: "/find-a-charger" },
];

// Colored tick used in place of generic section numbers.
const Tick = ({ color }: { color: string }) => (
  <span className="mb-5 block h-1 w-9 rounded-full" style={{ background: color }} aria-hidden />
);

const SaveWithEvsWebinar = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />

    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white" style={{ background: INK }}>
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-40 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]" />
          <div className="absolute -right-20 top-0 h-[34rem] w-[34rem] rounded-full bg-secondary/20 blur-[130px]" />
        </div>

        <div className="container relative z-10 max-w-4xl px-4 pb-28 pt-32 md:pb-36 md:pt-40">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-white/55 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PUMP }} />
            Webinar replay · Part 01
          </div>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl animate-fade-up" style={{ animationDelay: "0.06s" }}>
            From the <span style={{ color: PUMP }}>Pump</span>
            <br className="hidden sm:block" /> to the <span className="text-secondary">Plug</span>
          </h1>

          {/* signature: pump → plug */}
          <div className="mt-7 flex max-w-md items-center gap-3 animate-fade-up" style={{ animationDelay: "0.12s" }}>
            <Fuel className="h-5 w-5 shrink-0" style={{ color: PUMP }} />
            <span className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(232,148,58,0.6), rgba(31,150,80,0.6))" }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">gas → electric</span>
            <span className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(232,148,58,0.6), rgba(31,150,80,0.6))" }} />
            <PlugZap className="h-5 w-5 shrink-0 text-secondary" />
          </div>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl animate-fade-up" style={{ animationDelay: "0.18s" }}>
            How electric vehicles are saving everyday drivers money — the real math on fuel,
            maintenance, and incentives, in plain English. Watch Part 1 of the series below.
          </p>
        </div>
      </section>

      {/* ── Video (lifted onto paper) ─────────────────────────────────────── */}
      <section className="bg-background">
        <div className="container relative z-20 -mt-14 max-w-4xl px-4 md:-mt-24">
          <WebinarVideo />
          <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Part 01 · the savings, explained
            </p>
            <a
              href="/events/from-pump-to-plug"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Ticket className="h-4 w-4" /> Register for Part 2 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── What you'll learn — itemized receipt ──────────────────────────── */}
      <section className="bg-background py-20 md:py-28">
        <div className="container max-w-3xl px-4">
          <Tick color={PUMP} />
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">What you'll learn</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            No hype and no jargon — just where the savings come from, line by line.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-dashed border-border pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Itemized</span>
              <span>Pump → Plug</span>
            </div>
            <ul className="space-y-4">
              {LEARN.map((row) => (
                <li key={row.label} className="flex items-baseline gap-3">
                  <span className="font-medium text-foreground">{row.label}</span>
                  <span className="mb-1 flex-1 border-b border-dotted border-border" aria-hidden />
                  <span className="text-right text-sm text-muted-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Your next stop — nav cards on ink ─────────────────────────────── */}
      <section className="text-white" style={{ background: INK }}>
        <div className="container max-w-6xl px-4 py-20 md:py-28">
          <Tick color="hsl(var(--secondary))" />
          <h2 className="font-display text-2xl font-bold md:text-3xl">Your next stop</h2>
          <p className="mt-2 max-w-xl text-white/60">
            Turn the webinar into your own numbers — pick where to go from here.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STOPS.map((s, i) => {
              const body = (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white/20">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-white/35">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-white/60">{s.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-all group-hover:gap-2.5">
                    Open <ArrowUpRight className="h-4 w-4" />
                  </span>
                </>
              );
              const cls =
                "group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60";
              return s.external ? (
                <a key={s.title} href={s.to} className={cls}>{body}</a>
              ) : (
                <Link key={s.title} to={s.to} className={cls}>{body}</Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default SaveWithEvsWebinar;
