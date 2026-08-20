// Rebate Claim Plan — a pre-screening that leads with the deadline, not the money.
//
// The design decision this page exists to express: the headline is the BINDING
// CONSTRAINT, and the figure is a supporting line. A window that has not opened,
// a deadline that has run out, or a rule change weeks away all outrank the
// amount — and when a hard stop applies the figure is suppressed entirely
// rather than shown with a caveat underneath.
//
// Comparable tools, including the state-run ones, do the opposite: a large green
// number with the constraint in grey small print, or in a dismissible banner the
// calculator itself never consults. That is how someone buys a car six days
// before the purchase window opens and receives nothing.
//
// All rules, amounts and clocks live in @/lib/eligibility/rules — this file only
// renders them.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitLead, type LeadFormType } from "@/lib/submitLead";
import { isValidEmail } from "@/lib/lead";
import { INCENTIVES_DISCLAIMER } from "@/lib/disclaimers";
import {
  evaluate, visibleQuestions, optionsFor, documentsFor, formatMoney, formatIsoDate, todayIso,
  pruneHiddenAnswers, stateForEligibility,
  EMPTY_ANSWERS, type Answers, type Question, type Result, type Evaluation,
} from "@/lib/eligibility/rules";
import {
  decodeVin, isPlausibleVin, vinToAnswers, referenceYearFor, describeFacts,
} from "@/lib/eligibility/vin";

const STATUS_LABEL: Record<Result["status"], string> = {
  eligible: "Likely eligible",
  need: "One answer short",
  superseded: "Not with the other one",
  stopped: "Too late",
  excluded: "Does not apply",
};

const STATUS_CHIP: Record<Result["status"], string> = {
  eligible: "bg-secondary/10 text-secondary border-secondary/30",
  need: "bg-amber-50 text-amber-900 border-amber-300",
  superseded: "bg-primary/10 text-primary border-primary/30",
  stopped: "bg-red-50 text-red-800 border-red-200",
  excluded: "bg-muted text-muted-foreground border-border",
};

/* ── one question ─────────────────────────────────────────────────────────
   Native fieldset/legend/radio rather than a custom widget: it is the shape
   screen readers already understand, and React keeps the DOM node across
   re-renders so focus survives every answer. No auto-advance.              */

function QuestionField({
  q, answers, onChange, verified,
}: {
  q: Question; answers: Answers;
  onChange: (key: keyof Answers, value: unknown) => void;
  verified?: boolean;
}) {
  const value = answers[q.key];

  // A verified answer came from the VIN, not from the reader. It stays editable —
  // if the decode is wrong about their car, they are right and we are not.
  const mark = verified ? (
    <span className="ml-1.5 align-middle text-[0.62rem] font-bold uppercase tracking-wider text-secondary">
      ✓ from VIN
    </span>
  ) : null;

  if (q.kind === "zip" || q.kind === "date" || q.kind === "money") {
    const id = `f-${String(q.key)}`;
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-foreground">
          {q.legend}{mark}
          {q.hint && <span className="block text-xs font-normal text-muted-foreground mt-0.5">{q.hint}</span>}
        </label>
        <div className="mt-2 flex items-center gap-1.5">
          {q.kind === "money" && <span className="text-muted-foreground font-mono" aria-hidden="true">$</span>}
          <Input
            id={id}
            type={q.kind === "date" ? "date" : "text"}
            inputMode={q.kind === "zip" ? "numeric" : q.kind === "money" ? "decimal" : undefined}
            maxLength={q.kind === "zip" ? 5 : undefined}
            max={q.kind === "date" ? todayIso() : undefined}
            autoComplete={q.kind === "zip" ? "postal-code" : undefined}
            placeholder={q.kind === "zip" ? "97204" : q.kind === "money" ? "28,500" : undefined}
            className={`font-mono tabular-nums ${q.kind === "zip" ? "w-28 tracking-widest" : q.kind === "money" ? "w-36" : "w-44"}`}
            value={
              q.kind === "money"
                ? (typeof value === "number" ? value.toLocaleString("en-US") : "")
                : String(value ?? "")
            }
            onChange={(e) => {
              const raw = e.target.value;
              if (q.kind === "zip") onChange(q.key, raw.replace(/\D/g, "").slice(0, 5));
              else if (q.kind === "money") {
                const digits = raw.replace(/\D/g, "");
                onChange(q.key, digits ? Number(digits) : null);
              } else onChange(q.key, raw);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-foreground">
        {q.legend}{mark}
        {q.hint && <span className="block text-xs font-normal text-muted-foreground mt-0.5">{q.hint}</span>}
      </legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {optionsFor(q, answers).map(([val, label]) => {
          const checked = value === val;
          return (
            <label key={val} className="relative">
              <input
                type="radio"
                name={String(q.key)}
                value={val}
                checked={checked}
                onChange={() => onChange(q.key, val)}
                className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span
                className={`block rounded-lg border-2 px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors
                  peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary
                  ${checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-transparent text-foreground hover:border-border"}`}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── lead capture ─────────────────────────────────────────────────────────
   Consent starts unticked and gates the BUTTON, never the result. The plan is
   already fully visible above; this asks for an address to send it to, and
   nothing is withheld if the reader declines.                              */

function CaptureCard({
  formType, heading, blurb, cta, payload,
}: {
  formType: LeadFormType; heading: string; blurb: string; cta: string;
  payload: Record<string, unknown>;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = consent && isValidEmail(email);

  const send = async () => {
    if (!ready || busy) return;
    setBusy(true);
    // submitLead never throws and never blocks the UX — a backend hiccup must
    // not make the reader think their plan was lost.
    await submitLead(formType, { email: email.trim(), consent: true, ...payload });
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <p className="font-semibold text-secondary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" /> On its way to {email.trim()}.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          We will not pass your address to any rebate program, and we only email again if a rule changes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display font-bold text-foreground">{heading}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-3">{blurb}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label={heading}
          className="flex-1 min-w-[14rem]"
        />
        <Button onClick={send} disabled={!ready || busy}>{busy ? "Sending…" : cta}</Button>
      </div>
      <label className="flex items-start gap-2 mt-3 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[hsl(var(--primary))]"
        />
        <span>
          Yes, email me about this. We will not pass your address to any rebate program,
          and you can stop it with one click.
        </span>
      </label>
    </div>
  );
}

/* ── one program ──────────────────────────────────────────────────────────── */

function ProgramCard({ r, answers }: { r: Result; answers: Answers }) {
  const p = r.program;
  const dim = r.status === "excluded" || r.status === "superseded" || r.status === "stopped";
  const docs = useMemo(() => documentsFor(r, answers), [r, answers]);

  return (
    <article className={`rounded-2xl border border-border overflow-hidden ${dim ? "bg-muted/40" : "bg-card shadow-sm"}`}>
      <div className={`p-5 flex flex-wrap gap-4 items-start ${dim ? "" : "border-b border-border"}`}>
        <div className="flex-1 min-w-[16rem]">
          <h3 className="font-display font-bold text-foreground leading-snug">{p.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{p.administrator}</p>
        </div>

        <span className={`shrink-0 rounded px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider border ${STATUS_CHIP[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>

        {/* "up to" sits inside the same element as the digits, so the qualifier
            renders at the same size and weight as the number it qualifies. */}
        {r.status === "eligible" && r.amount !== null && (
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-2xl text-secondary tabular-nums whitespace-nowrap">
              <span className="text-base">up to</span> {formatMoney(r.amount)}
            </p>
            {r.basis && <p className="text-xs text-muted-foreground mt-1 max-w-[15rem]">{r.basis}</p>}
          </div>
        )}
        {r.status === "need" && r.floor !== null && (
          <div className="text-right shrink-0">
            <p className="font-display font-bold text-2xl text-secondary tabular-nums whitespace-nowrap">
              {formatMoney(r.floor)} <span className="text-base">confirmed</span>
            </p>
            {r.basis && <p className="text-xs text-muted-foreground mt-1 max-w-[15rem]">{r.basis}</p>}
          </div>
        )}
        {r.status === "need" && r.floor === null && r.basis && (
          <p className="text-xs text-muted-foreground max-w-[15rem] shrink-0">{r.basis}</p>
        )}
      </div>

      {r.status === "need" ? (
        <p className={`px-5 py-3 text-sm text-muted-foreground ${dim ? "" : "bg-muted/50 border-b border-border"}`}>
          <span className="font-semibold text-foreground">Still needed: </span>
          {r.missing ?? "one more answer above."}
        </p>
      ) : r.reason ? (
        <p className={`px-5 py-3 text-sm text-muted-foreground ${dim ? "" : "bg-muted/50 border-b border-border"}`}>
          {r.reason}
        </p>
      ) : null}

      {/* No plan for a claim that cannot be made. A stopped program keeps its
          timeline so the dates explain themselves, but never regains a figure. */}
      {r.status !== "excluded" && r.status !== "superseded" && (
        <>
          {r.status !== "stopped" && (p.prerequisites.length + r.extraPrerequisites.length) > 0 && (
            <section className="p-5 border-b border-border">
              <h4 className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                <span className="text-primary mr-1.5">①</span> Before you apply
              </h4>
              <ol className="space-y-3">
                {/* Reader-dependent fixes first — a licence problem blocks every
                    program at once, so it outranks any single program's step. */}
                {[...r.extraPrerequisites, ...p.prerequisites].map((pre, i) => (
                  <li key={pre.what} className="grid grid-cols-[1.35rem_1fr] gap-2.5">
                    <span className="grid place-items-center w-[1.35rem] h-[1.35rem] rounded bg-primary/10 text-primary font-mono text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm">
                      {pre.url ? (
                        <a href={pre.url} target="_blank" rel="noopener noreferrer"
                          className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                          {pre.what} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">{pre.what}</span>
                      )}
                      <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{pre.why}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {r.clock.lines.length > 0 && (
            <section className="p-5 border-b border-border">
              <h4 className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                <span className="text-primary mr-1.5">②</span> By when
              </h4>
              <ul className="space-y-2.5">
                {r.clock.lines.map((l, i) => (
                  <li key={`${l.when}-${i}`} className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
                    <span className={`font-mono text-xs tabular-nums pt-0.5 ${
                      l.heat === "hot" ? "font-semibold text-amber-600"
                      : l.heat === "dead" ? "font-semibold text-red-600 line-through"
                      : "text-foreground/70"}`}>
                      {l.when}
                    </span>
                    <span className={l.heat === "dead" ? "text-red-600" : "text-muted-foreground"}>{l.what}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.status !== "stopped" && (
            <section className="p-5 border-b border-border">
              <h4 className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                <span className="text-primary mr-1.5">③</span> What to bring
              </h4>
              <ul className="space-y-2.5">
                {docs.map((d, i) => {
                  const id = `doc-${r.id}-${i}`;
                  return (
                    <li key={d.what} className="grid grid-cols-[1.1rem_1fr] gap-2.5 text-sm">
                      <input type="checkbox" id={id} className="mt-1 w-4 h-4 accent-[hsl(var(--secondary))]" />
                      <label htmlFor={id} className="cursor-pointer">
                        {d.what}
                        <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{d.note}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2 text-xs font-medium text-secondary">
                We never ask you for any of this. It goes to {p.administrator.split(",")[0]}, on their own
                site, when you apply.
              </p>
            </section>
          )}
        </>
      )}

      <div className="px-5 py-3 bg-muted/50 flex flex-wrap gap-x-5 gap-y-1.5 items-center text-xs text-muted-foreground">
        <span className="flex-1 min-w-[18rem]">
          {p.lifetimeCap?.text} {p.fundingNote}
        </span>
        <a href={p.url} target="_blank" rel="noopener noreferrer"
          className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          Program rules <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

/* ── verdict ──────────────────────────────────────────────────────────────── */

function Verdict({ out }: { out: Evaluation }) {
  const live = out.results.filter((r) => r.status === "eligible" || r.status === "need");

  if (out.lead?.kind === "stop") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 mb-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-red-700 mb-2">Stop</p>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug text-balance mb-2">
          {out.lead.text}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          We are not showing an amount for it, because the amount is no longer available to you.
          Anything else you qualify for is still below.
        </p>
      </div>
    );
  }

  if (out.lead?.kind === "time" && out.lead.urgent) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 mb-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-amber-700 mb-2">Do this first</p>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug text-balance mb-2">
          {out.lead.urgent.headline}
        </h2>
        <p className="font-display font-bold text-5xl text-amber-600 tabular-nums leading-none mt-4">
          {out.lead.urgent.count}
        </p>
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-amber-700 mt-1.5">
          {out.lead.urgent.unit}
        </p>
        {out.bestAmount > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Then you look eligible for{" "}
            <span className="font-semibold text-secondary">up to {formatMoney(out.bestAmount)}</span>{" "}
            from one program — never a total, and never guaranteed.
          </p>
        )}
      </div>
    );
  }

  if (out.bestAmount > 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 mb-5 shadow-sm">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-2">Result</p>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug text-balance mb-2">
          You look eligible for up to {formatMoney(out.bestAmount)} — from one program, not a total.
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Below is what stands between you and it: the steps in order, the dates, and the documents
          you will be asked for.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-5 shadow-sm">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-2">Result</p>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug text-balance mb-2">
        {live.length ? "Almost — one answer is missing." : "Nothing in your state fits these answers."}
      </h2>
      <p className="text-sm text-muted-foreground max-w-2xl">
        {live.length
          ? "Fill in what each card asks for below and the plan completes."
          : "Every program we track is listed below with the reason why. Change an answer above and this updates."}
      </p>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const RebateEligibility = () => {
  // `?embed=1` renders the tool chrome-free for iframing on third-party sites.
  const embed = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";
  useEmbedFrame(embed);

  const [answers, setAnswers] = useState<Answers>({ ...EMPTY_ANSWERS });

  // The VIN is held HERE and nowhere else — deliberately not part of Answers.
  // Its only job is to produce answers; after that it is forgotten. Keeping it out
  // of the answer object means it cannot reach the rules engine, cannot be pruned
  // into anything, and cannot ride along in a lead payload to the CRM.
  const [vin, setVin] = useState("");
  const [vinState, setVinState] = useState<"idle" | "checking" | "found" | "nomatch">("idle");
  const [vinLabel, setVinLabel] = useState("");
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const out = useMemo(() => evaluate(answers), [answers]);
  const questions = useMemo(() => visibleQuestions({ ...answers, state: out.state }), [answers, out.state]);
  const live = out.results.filter((r) => r.status === "eligible" || r.status === "need");

  // Prune on every change: an answer whose question has just disappeared must
  // stop deciding the result. See pruneHiddenAnswers().
  const set = (key: keyof Answers, value: unknown) => {
    // A hand-edited answer is no longer "from the VIN". The reader knows their own
    // car better than a database does.
    setVerified((v) => {
      if (!v.has(String(key))) return v;
      const next = new Set(v);
      next.delete(String(key));
      return next;
    });
    setAnswers((a) => {
      const next = { ...a, [key]: value } as Answers;
      return pruneHiddenAnswers({ ...next, state: stateForEligibility(next.zip) });
    });
  };

  // Decode as soon as the VIN is structurally complete. Aborts any call still in
  // flight when the reader keeps typing, and every failure path lands on "nomatch",
  // which changes nothing except a line of reassurance — the questions below still
  // work exactly as they did.
  useEffect(() => {
    if (!isPlausibleVin(vin)) {
      setVinState("idle");
      setVinLabel("");
      return;
    }
    const ac = new AbortController();
    setVinState("checking");
    decodeVin(vin, ac.signal).then((facts) => {
      if (ac.signal.aborted) return;
      if (!facts) {
        setVinState("nomatch");
        setVinLabel("");
        return;
      }
      setVinState("found");
      setVinLabel(describeFacts(facts));
      setAnswers((a) => {
        const filled = vinToAnswers(facts, referenceYearFor(a.purchaseDate));
        setVerified(new Set(Object.keys(filled)));
        return pruneHiddenAnswers({ ...a, ...filled, state: stateForEligibility(a.zip) });
      });
    });
    return () => ac.abort();
  }, [vin]);

  const [discIntro, discLiability = ""] = INCENTIVES_DISCLAIMER.split("\n\n");

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="EV Rebate Eligibility — deadlines, documents and what you may qualify for"
        description="Check which EV rebates you may qualify for in Oregon, Delaware and PG&E territory — with the purchase windows, application deadlines and document checklist that decide whether a claim actually lands."
      />
      {!embed && <Navbar />}
      {/* The site Navbar is `fixed` and 66px tall, so it is out of flow. This
          spacer puts the badge bar directly beneath it instead of behind it. */}
      {!embed && <div className="h-[66px]" aria-hidden="true" />}

      {/* Sticky, so it cannot be cropped out of a screenshot of the number.
          Pinned below the fixed Navbar, or to the top when embedded. */}
      <div className={`sticky z-20 bg-card border-b border-border ${embed ? "top-0" : "top-[66px]"}`}>
        <div className="container px-4 max-w-5xl py-2.5 flex items-center gap-3 flex-wrap">
          <span className="rounded px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
            Pre-screening · not an application
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            rules checked {formatIsoDate(out.verifiedAt)}
            {out.staleDays > 30 && <span className="text-amber-600 font-semibold"> · {out.staleDays} days ago</span>}
          </span>
        </div>
      </div>

      <main className="container px-4 max-w-5xl pb-20">
        <header className="pt-8 pb-6">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-foreground tracking-tight text-balance">
            What stands between you and the money
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Six or so questions. We never ask for a document, an account or a Social Security number —
            and we show you the deadline before we show you the figure.
          </p>
        </header>

        <section aria-labelledby="answers-heading" className="rounded-2xl border border-border bg-card shadow-sm p-5 mb-7">
          <h2 id="answers-heading" className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Your answers
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {questions.map((q) => (
              <QuestionField
                key={String(q.key)}
                q={q}
                answers={{ ...answers, state: out.state }}
                onChange={set}
                verified={verified.has(String(q.key))}
              />
            ))}

            {/* Optional, and it stays optional. Everything below works without it —
                a VIN just replaces three guesses about your own car with facts. */}
            {out.covered && (
              <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 p-4">
                <label htmlFor="f-vin" className="block text-sm font-semibold text-foreground">
                  VIN <span className="font-normal text-muted-foreground">(optional)</span>
                  <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                    17 characters, on your windscreen or registration. We check it against the
                    federal vehicle database, then forget it — it is never saved or sent anywhere.
                  </span>
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Input
                    id="f-vin"
                    type="text"
                    inputMode="text"
                    maxLength={17}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="5YJ3E1EA8JF000000"
                    className="font-mono tracking-wider w-[22ch] uppercase"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 17))}
                  />
                  <p className="text-xs" aria-live="polite">
                    {vinState === "checking" && <span className="text-muted-foreground">Checking…</span>}
                    {vinState === "found" && (
                      <span className="font-medium text-secondary">✓ {vinLabel}</span>
                    )}
                    {vinState === "nomatch" && (
                      <span className="text-muted-foreground">
                        We could not match that VIN. No problem — just answer the questions below.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Only this region is announced — the controls above never re-announce. */}
        <div role="region" aria-live="polite" aria-label="Results">
          {!out.state ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-2">Start here</p>
              <h2 className="font-display font-bold text-xl text-foreground mb-2">Enter your ZIP code.</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Everything follows from where you live — the programs, the deadlines and the paperwork
                are all state or utility specific.
              </p>
            </div>
          ) : !out.covered ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-5">
                <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-2">Coverage</p>
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground leading-snug text-balance mb-2">
                  We do not model a program in {out.state} — yet.
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  That is a gap in <em>our</em> list, not a determination about you. This tool covers Oregon,
                  Delaware and PG&amp;E territory in California in full detail. Most states run something, and
                  utilities and air districts run more — those are the ones people miss.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 mb-5">
                <h3 className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  <span className="text-primary mr-1.5">→</span> Where to look in the meantime
                </h3>
                <ol className="space-y-3">
                  <li className="grid grid-cols-[1.35rem_1fr] gap-2.5">
                    <span className="grid place-items-center w-[1.35rem] h-[1.35rem] rounded bg-primary/10 text-primary font-mono text-xs font-bold">1</span>
                    <span className="text-sm">
                      <Link to="/rebates-incentives" className="text-primary font-medium hover:underline">
                        Our incentives directory for {out.state}
                      </Link>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Federal, state and utility programs we track, without the deadline modelling.
                      </span>
                    </span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] gap-2.5">
                    <span className="grid place-items-center w-[1.35rem] h-[1.35rem] rounded bg-primary/10 text-primary font-mono text-xs font-bold">2</span>
                    <span className="text-sm">
                      <a href="https://afdc.energy.gov/laws" target="_blank" rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                        The US Department of Energy&rsquo;s national list <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Every federal, state and local program they know about, filterable by state.
                      </span>
                    </span>
                  </li>
                  <li className="grid grid-cols-[1.35rem_1fr] gap-2.5">
                    <span className="grid place-items-center w-[1.35rem] h-[1.35rem] rounded bg-primary/10 text-primary font-mono text-xs font-bold">3</span>
                    <span className="text-sm">
                      <span className="font-medium text-foreground">Your own electricity provider</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        Utility rebates are the least advertised and the most often missed. Search your
                        provider&rsquo;s name plus &ldquo;EV rebate&rdquo;.
                      </span>
                    </span>
                  </li>
                </ol>
              </div>

              <CaptureCard
                formType="eligibility-coverage"
                heading={`Tell me when you cover ${out.state}`}
                blurb="One email, the day we add a program for your area. Nothing else, ever."
                cta="Notify me"
                payload={{ state: out.state, zip: answers.zip }}
              />
            </>
          ) : (
            <>
              <Verdict out={out} />

              <div className="flex flex-col gap-4">
                {out.results.map((r) => (
                  <ProgramCard key={r.id} r={r} answers={answers} />
                ))}
              </div>

              {live.length > 0 && (
                <div className="mt-5">
                  <CaptureCard
                    formType="eligibility-plan"
                    heading="Email me this plan"
                    blurb="The checklist, the deadlines and the links — as one message you can work through. We do not follow up unless a rule changes."
                    cta="Send it"
                    // DELIBERATELY MINIMAL — do not add the amount or the
                    // program names back without reading this first.
                    //
                    // api/lead.ts appends every unrecognised body field verbatim
                    // to a GoHighLevel note (`...Object.entries(rest)`), so
                    // anything sent here becomes durable CRM text that sales and
                    // marketing staff browse. Our own Supabase table is
                    // default-deny and would drop these, but the CRM is not.
                    //
                    // Both of the obvious things to send leak income status by
                    // inference: Oregon Charge Ahead and PG&E Rebate Plus ARE the
                    // income-qualified tiers, so "Charge Ahead" or "7500" in a
                    // note says this household is under 400% of the federal
                    // poverty guidelines. A count carries the useful signal —
                    // did we find them anything — with no such inference.
                    payload={{
                      state: out.state,
                      zip: answers.zip,
                      programCount: live.length,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <aside className="mt-8 rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground leading-relaxed">
          <p className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-semibold text-foreground">This is a pre-screening, not an application.</span>{" "}
              Nothing here is submitted anywhere and no program sees it. Every figure is an estimate from
              published rules; the administrator decides the real amount when they review your application,
              and several of these programs waitlist people once the year&rsquo;s funding runs out.{" "}
              <span className="font-semibold text-foreground">We never sum programs</span> — most cannot be
              combined, and Oregon&rsquo;s two are explicitly mutually exclusive. Rules checked{" "}
              <span className="font-semibold text-foreground">{formatIsoDate(out.verifiedAt)}</span>.
            </span>
          </p>
          <p className="mt-3">{discIntro}</p>
          {discLiability && <p className="mt-2">{discLiability}</p>}
          <p className="mt-3">
            <Link to="/rebates-incentives" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              Browse every incentive we track <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </p>
        </aside>
      </main>

      {!embed && <Footer />}
    </div>
  );
};

export default RebateEligibility;
