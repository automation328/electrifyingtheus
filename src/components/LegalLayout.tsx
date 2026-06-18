import { useEffect } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface LegalBlock {
  subheading?: string;
  body?: string[];
  list?: string[];
}

export interface LegalSection {
  heading: string;
  body: string[];
  list?: string[];
  /** Paragraphs rendered after the bullet list. */
  footer?: string[];
  /** Sub-blocks (each an optional subheading + paragraphs + list) for sections
   *  with multiple labelled groups (e.g. "Information We Collect"). */
  blocks?: LegalBlock[];
}

// An optional second document rendered on the same page (e.g. SMS Terms beneath
// the Privacy Policy), with its own heading and independently restarted numbering.
export interface LegalAppendix {
  heading: string;
  effectiveDate?: string;
  preamble?: string[];
  sections: LegalSection[];
}

interface LegalLayoutProps {
  badge: string;
  title: string;
  highlight: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
  /** Paragraphs shown above the numbered sections (un-numbered). */
  preamble?: string[];
  /** A second, separately-numbered document block appended after the main one. */
  appendix?: LegalAppendix;
  icon?: LucideIcon;
}

const Sections = ({ sections }: { sections: LegalSection[] }) => (
  <>
    {sections.map((s, i) => (
      <section key={i}>
        <h2 className="text-xl font-bold font-display text-foreground mb-3">
          <span className="text-primary mr-2">{String(i + 1).padStart(2, "0")}</span>
          {s.heading}
        </h2>
        {s.body.map((p, j) => (
          <p key={j} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
        ))}
        {s.list && (
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            {s.list.map((li, k) => (
              <li key={k} className="leading-relaxed">{li}</li>
            ))}
          </ul>
        )}
        {s.footer && s.footer.map((p, k) => (
          <p key={`f-${k}`} className="text-muted-foreground leading-relaxed mt-3">{p}</p>
        ))}
        {s.blocks && s.blocks.map((b, k) => (
          <div key={`b-${k}`} className="mt-4">
            {b.subheading && (
              <h3 className="font-semibold text-foreground mb-1.5">{b.subheading}</h3>
            )}
            {b.body && b.body.map((p, j) => (
              <p key={j} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
            {b.list && (
              <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
                {b.list.map((li, j) => (
                  <li key={j} className="leading-relaxed">{li}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    ))}
  </>
);

const LegalLayout = ({
  badge, title, highlight, intro, effectiveDate, sections, preamble, appendix,
  icon: Icon = ShieldCheck,
}: LegalLayoutProps) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-3xl">
            <div className="text-center max-w-2xl mx-auto pb-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                <Icon className="w-4 h-4" /> {badge}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-3">
                {title} <span className="text-gradient-primary">{highlight}</span>
              </h1>
              <p className="text-muted-foreground">{intro}</p>
              <p className="text-xs text-muted-foreground mt-3">Effective date: {effectiveDate}</p>
            </div>
          </div>
        </section>

        {/* Body */}
        <article className="container px-4 max-w-3xl mt-10 space-y-8">
          {preamble && preamble.map((p, i) => (
            <p key={`pre-${i}`} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}

          <Sections sections={sections} />

          {appendix && (
            <>
              <hr className="border-border" />
              <div>
                <h2 className="text-2xl font-bold font-display text-foreground mb-2">{appendix.heading}</h2>
                {appendix.effectiveDate && (
                  <p className="text-xs text-muted-foreground mb-4">Effective date: {appendix.effectiveDate}</p>
                )}
              </div>
              {appendix.preamble && appendix.preamble.map((p, i) => (
                <p key={`apx-pre-${i}`} className="text-muted-foreground leading-relaxed">{p}</p>
              ))}
              <Sections sections={appendix.sections} />
            </>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Questions about this policy? Contact us at{" "}
            <a href="mailto:info@electrifyingtheus.com" className="font-semibold text-primary hover:underline">
              info@electrifyingtheus.com
            </a>.
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;
